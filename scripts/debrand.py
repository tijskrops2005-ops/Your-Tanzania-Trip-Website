#!/usr/bin/env python3
"""Removes the old operator's logo from photos, maps and graphics, in place.

The images to treat are listed in scripts/debrand-list.txt (paths relative to wp-content/uploads,
found with a Vision OCR scan for the old brand name). For every listed image:
  1. the largest size variant is taken from the untouched copy in .cache/photos-original/
     (made on first run),
  2. Apple Vision (scripts/ocr-boxes.js) locates the logo text ("TANZANIA SPECIALIST .COM",
     "AFRICA SAFARI TRIPS"); the logo box is that text plus the round badge next to it,
  3. the box is filled with the surrounding colour; on maps and graphics (flat background) the
     Your Tanzania Trip logo is placed in the same spot, on photos (jeep doors) the sticker is
     just painted out,
  4. every size variant (name-WxH.ext) is regenerated from the cleaned image with the same
     centre crop WordPress used.

Usage: python3 scripts/debrand.py            (all listed images)
       python3 scripts/debrand.py <rel> ...  (only these)
"""
import json, os, re, shutil, subprocess, sys, tempfile
from PIL import Image, ImageFilter, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UP = os.path.join(ROOT, "public/wp-content/uploads")
BACKUP = os.path.join(ROOT, ".cache/photos-original")
LIST = os.path.join(ROOT, "scripts/debrand-list.txt")
LOGO = Image.open(os.path.join(ROOT, "public/brand/logo-primary.png")).convert("RGBA")
LOGO_REV = Image.open(os.path.join(ROOT, "public/brand/logo-reversed.png")).convert("RGBA")

KEY = re.compile(r"SPECIAL|SPECIALST|ECIALIST|CIALIST|PECIAL|SPECA[UL]|SPECAN|SPECL|SPEDAL|SPEZ|TSPEC|TANZANIASPE|TANZANLASPE|SAFARI ?TRIPS|AFRICA SAFARI")
GRAPHIC_NAME = re.compile(r"Kaart|[Mm]ap|Migration|TZ-Ex|routes|What-to-wear|Packing-List")
NEAR = re.compile(r"^(?:TANZANIA|TAN|ZANIA|\.?COM|CON|COL|AFRICA|SAFARI|TRIPS|TANZANIA ?\.?COM|AFRICA SAFARI|\.COM •?)$")


def variants(rel):
    d, name = os.path.split(rel)
    stem, ext = os.path.splitext(name)
    base = re.sub(r"-scaled$", "", stem)
    folder = os.path.join(UP, d)
    out = []
    for f in os.listdir(folder):
        s, e = os.path.splitext(f)
        if e.lower() != ext.lower():
            continue
        if s in (stem, base) or re.fullmatch(re.escape(base) + r"(?:-scaled)?(?:-\d+x\d+)?", s):
            out.append(os.path.join(folder, f))
    return out


def original(path):
    rel = os.path.relpath(path, UP)
    dst = os.path.join(BACKUP, rel)
    if not os.path.exists(dst):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(path, dst)
    return dst


def ocr(paths):
    with tempfile.TemporaryDirectory() as t:
        lst = os.path.join(t, "list.txt")
        out = os.path.join(t, "out.json")
        open(lst, "w").write("\n".join(paths) + "\n")
        subprocess.run(["osascript", "-l", "JavaScript", os.path.join(ROOT, "scripts/ocr-boxes.js"), lst, out], check=True, capture_output=True)
        return json.load(open(out))


def to_px(o, w, h):
    x0 = o["x"] * w
    x1 = (o["x"] + o["w"]) * w
    y0 = (1 - o["y"] - o["h"]) * h
    y1 = (1 - o["y"]) * h
    return [x0, y0, x1, y1]


def logo_boxes(obs, w, h):
    """Clusters of logo text, each grown to cover the two-line wordmark and the round badge."""
    keys = [to_px(o, w, h) for o in obs if KEY.search(o["t"].upper())]
    near = [to_px(o, w, h) for o in obs if NEAR.match(o["t"].upper().strip(" |•"))]
    clusters = []
    for b in keys:
        for c in clusters:
            if not (b[2] < c[0] - 5 or b[0] > c[2] + 5 or b[3] < c[1] - 5 or b[1] > c[3] + 5):
                c[:] = [min(c[0], b[0]), min(c[1], b[1]), max(c[2], b[2]), max(c[3], b[3])]
                break
        else:
            clusters.append(list(b))
    out = []
    for c in clusters:
        lh = c[3] - c[1]
        # pull in nearby words of the lockup (TANZANIA above, .COM / circle right, AFRICA SAFARI TRIPS badge)
        for _ in range(2):
            for n in near:
                if n[0] < c[2] + 3.2 * lh and n[2] > c[0] - 1.5 * lh and n[1] < c[3] + 1.6 * lh and n[3] > c[1] - 1.6 * lh:
                    c[:] = [min(c[0], n[0]), min(c[1], n[1]), max(c[2], n[2]), max(c[3], n[3])]
        lh = max(c[3] - c[1], 1)
        # the wordmark has two lines; one line found -> the other is right above it
        if lh < 1.6 * (c[3] - c[1]):
            c[1] -= 0.95 * lh
        lh = c[3] - c[1]
        # badge circle to the right of the text: about the height of the lockup
        c[2] += 0.95 * lh
        pad = 0.18 * lh
        out.append([max(0, int(c[0] - pad)), max(0, int(c[1] - pad)), min(w, int(c[2] + pad)), min(h, int(c[3] + pad))])
    # merge overlapping boxes
    merged = []
    for b in sorted(out):
        if merged and b[0] <= merged[-1][2] and b[1] <= merged[-1][3] and b[3] >= merged[-1][1]:
            m = merged[-1]
            merged[-1] = [min(m[0], b[0]), min(m[1], b[1]), max(m[2], b[2]), max(m[3], b[3])]
        else:
            merged.append(b)
    return merged


def ring(img, box, pad):
    x0, y0, x1, y1 = box
    r = img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))
    inner = Image.new("L", r.size, 255)
    inner.paste(0, (x0 - max(0, x0 - pad), y0 - max(0, y0 - pad), x1 - max(0, x0 - pad), y1 - max(0, y0 - pad)))
    return r, inner


def fill(img, box, graphic):
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    pad = max(6, int(min(bw, bh) * 0.25))
    r, mask = ring(img, box, pad)
    stat = ImageStat.Stat(r.convert("RGB"), mask)
    med = tuple(int(v) for v in stat.median)
    if graphic:
        img.paste(Image.new("RGB", (bw, bh), med), (x0, y0))
    else:
        # photo: fill with the surrounding colour, then a soft blend of the edges
        patch = Image.new("RGB", (bw, bh), med)
        img.paste(patch, (x0, y0))
        region = (max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad))
        blurred = img.crop(region).filter(ImageFilter.GaussianBlur(max(2, pad // 2)))
        m = Image.new("L", blurred.size, 0)
        m.paste(255, (x0 - region[0] - pad // 3, y0 - region[1] - pad // 3, x1 - region[0] + pad // 3, y1 - region[1] + pad // 3))
        m = m.filter(ImageFilter.GaussianBlur(max(2, pad // 3)))
        img.paste(blurred, region[:2], m)
    return med


def is_graphic(img, box=None):
    """Maps, infographics and flyers have few flat colours; photos do not."""
    small = img.convert("RGB").resize((160, max(1, int(160 * img.height / img.width))))
    q = small.quantize(colors=64, method=Image.Quantize.MEDIANCUT)
    counts = sorted((c for c, _ in q.getcolors(64) or []), reverse=True)
    total = sum(counts) or 1
    return sum(counts[:8]) / total > 0.55


def place_logo(img, box, bg):
    x0, y0, x1, y1 = box
    lum = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]
    logo = LOGO if lum > 120 else LOGO_REV
    bw, bh = x1 - x0, y1 - y0
    lw = int(bw * 0.92)
    lh = int(lw * logo.height / logo.width)
    if lh > bh * 1.15:
        lh = int(bh * 1.15)
        lw = int(lh * logo.width / logo.height)
    lg = logo.resize((max(1, lw), max(1, lh)), Image.LANCZOS)
    img.paste(lg, (x0 + (bw - lw) // 2, y0 + (bh - lh) // 2), lg)


def cover(src, size):
    w, h = size
    s = max(w / src.width, h / src.height)
    im = src.resize((max(1, round(src.width * s)), max(1, round(src.height * s))), Image.LANCZOS)
    l, t = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((l, t, l + w, t + h))


def save(img, path):
    ext = os.path.splitext(path)[1].lower()
    rgb = img.convert("RGB")
    if ext in (".jpg", ".jpeg"):
        rgb.save(path, quality=88, optimize=True)
    elif ext == ".webp":
        rgb.save(path, quality=86)
    elif ext == ".avif":
        rgb.save(path, quality=70)
    else:
        img.save(path)


def main(rels):
    jobs = []
    seen = set()
    for rel in rels:
        key = re.sub(r"-scaled$", "", os.path.splitext(rel)[0])
        if key in seen:
            continue
        seen.add(key)
        vs = variants(rel)
        if not vs:
            print("missing:", rel, file=sys.stderr)
            continue
        origs = {v: original(v) for v in vs}
        biggest = max(vs, key=lambda v: (lambda im: im.width * im.height)(Image.open(origs[v])))
        jobs.append((rel, vs, origs, biggest))
    boxes = ocr([j[2][j[3]] for j in jobs])
    done = 0
    for rel, vs, origs, biggest in jobs:
        src = origs[biggest]
        img = Image.open(src).convert("RGB")
        found = logo_boxes(boxes.get(src, []), img.width, img.height)
        if not found:
            print("no logo text found:", rel, file=sys.stderr)
            continue
        graphic = bool(GRAPHIC_NAME.search(rel)) or is_graphic(img)
        for b in found:
            bg = fill(img, b, graphic)
            if graphic:
                place_logo(img, b, bg)
        full_w, full_h = img.size
        for v in vs:
            size = Image.open(origs[v]).size
            out = img if size == (full_w, full_h) else cover(img, size)
            save(out, v)
        done += 1
        print(f"debranded {rel}: {len(found)} logo(s), {len(vs)} files")
    print(f"debrand: {done}/{len(jobs)} images")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        args = [l.strip() for l in open(LIST) if l.strip() and not l.startswith("#")]
    main(args)
