#!/usr/bin/env python3
"""Replaces photos that show the old operator's logo or staff with logo-free photos, in place.

Every size variant of a listed upload (name-WxH.ext) is overwritten by the replacement photo,
cover-cropped to exactly the same pixel size, so no HTML has to change. Originals are kept once in
.cache/photos-original/ and the script starts from those, so it can be run again safely.

Usage: python3 scripts/clean-photos.py
"""
import os, re, shutil, sys
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UP = os.path.join(ROOT, "public/wp-content/uploads")
BRAND = os.path.join(ROOT, "public/brand/partner")
BACKUP = os.path.join(ROOT, ".cache/photos-original")

# base file (without size suffix) -> replacement source (full path)
REPLACE = {
    # jeeps with the old logo on the spare-wheel covers or doors
    "2024/12/Africa-Safari-jeep-2.jpg": f"{UP}/2023/07/Serengeti-Jeep-scaled.jpg",
    "2024/12/Africa-Safari-jeep-3.jpg": f"{UP}/2023/07/Serengeti-Jeep-scaled.jpg",
    "2024/06/Private-safari-lion.jpg": f"{UP}/2024/06/Safari-Jeep-lion.jpg",
    "2025/07/The-Great-Migration-2-1.jpg": f"{BRAND}/great-migration.jpg",
    "2023/07/Ngorongoro-jeep-1-scaled.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2023/07/Ngorongoro-jeep-1.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2025/04/Safari-jeep-3.jpg": f"{UP}/2023/07/Serengeti-Jeep-scaled.jpg",
    "2023/08/jeep-3.jpg": f"{UP}/2023/07/Serengeti-Jeep-scaled.jpg",
    "2023/08/jeep-4.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2023/08/jeep-5.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2023/07/Jeep.jpg": f"{UP}/2024/06/Safari-Jeep-lion.jpg",
    "2024/07/Safari-jeep-cheetahs-private.jpg": f"{UP}/2024/06/Safari-Jeep-lion.jpg",
    "2023/11/team_tanzania_specialist_jeeps.jpg": f"{BRAND}/crew-summit.webp",
    "2023/08/people_taking_pictures_in_jeep.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2023/08/people_taking_pictures_in_jeep_v2.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2023/08/people_taking_pictures_in_jeep-1.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2026/01/CI_Jeep-and-clients-4-scaled.jpg": f"{UP}/2023/07/Serengeti-Jeep-scaled.jpg",
    "2025/02/IM_TZ_MAK_Sunset-and-jeep-TS-logo-scaled-1.jpg": f"{UP}/2024/06/Safari-Jeep-lion.jpg",
    # the old operator's staff and group photos
    "2023/08/guide_tanzania_specialist.jpg": f"{UP}/2025/10/IM_TZ_SER_Guide-and-guests-looking-at-tree.jpg",
    "2023/11/team_member_tanzania_yellow.jpg": f"{BRAND}/baraka-dalali.webp",
    "2023/11/test_image_2-1.jpg": f"{BRAND}/baraka-dalali.webp",
    "2023/10/C0453.00_00_00_000.Still001.jpg": f"{UP}/2025/10/IM_TZ_SER_Guide-and-guests-looking-at-tree.jpg",
    "2023/10/TS-review-page.jpg": f"{BRAND}/crew-summit.webp",
    "2023/11/IMG_9772-800x500-1.webp": f"{BRAND}/crew-summit.webp",
    "2022/08/Are-Tanzanians-Friendly-A-Tourist-Guide-1.jpg": f"{BRAND}/crew-summit.webp",
    "2026/01/CI_AS_Client-having-a-view-from-AST-jeep-scaled.jpg": f"{UP}/2025/10/IM_TZ_TAR_Guests-and-guide-in-jeep-scaled.jpg",
    # spare-wheel covers / bottle with the old logo: too large to paint out, replaced (scan 2026-10-28)
    "2023/07/Jeep-lion-2.jpg": f"{BRAND}/safari-lions.webp",
    "2023/10/Tanzania-Specialist-safari-vehicule-1.jpg": f"{UP}/2023/07/Elephants-jeep-Tarangire-scaled.jpg",
    "2025/09/CI_AS_Client-having-a-view-from-AST-jeep.jpg": f"{BRAND}/safari.webp",
    "2026/01/CI_TS_Serengeti_Robbin-and-Mathanje-11-scaled.jpg": f"{UP}/2024/06/Safari-Jeep-lion.jpg",
    "2023/11/chair-and-TS-bottle.jpg": f"{BRAND}/crew-summit.webp",
    "2023/11/chair-and-TS-bottle-1.jpg": f"{BRAND}/kilimanjaro-dawn.webp",
}

# (file, box as fractions of width/height) -> the logo patch is filled with blurred surroundings
INPAINT = {}  # none at the moment: photos with large logos are replaced instead (see REPLACE)


def find_variants(base):
    d, name = os.path.split(base)
    stem, ext = os.path.splitext(name)
    out = []
    folder = os.path.join(UP, d)
    if not os.path.isdir(folder):
        return out
    for f in os.listdir(folder):
        s, e = os.path.splitext(f)
        if s == stem or re.fullmatch(re.escape(stem) + r"-\d+x\d+", s):
            out.append(os.path.join(folder, f))
    return out


def backup(path):
    rel = os.path.relpath(path, UP)
    dst = os.path.join(BACKUP, rel)
    if not os.path.exists(dst):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(path, dst)
    return dst


def cover(src_img, size):
    w, h = size
    sw, sh = src_img.size
    scale = max(w / sw, h / sh)
    img = src_img.resize((max(1, round(sw * scale)), max(1, round(sh * scale))), Image.LANCZOS)
    left = (img.width - w) // 2
    top = (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def save_like(img, path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".jpg", ".jpeg"):
        img.convert("RGB").save(path, quality=85, optimize=True)
    elif ext == ".webp":
        img.convert("RGB").save(path, quality=85)
    elif ext == ".avif":
        img.convert("RGB").save(path, quality=70)
    else:
        img.save(path)


def main():
    replaced = 0
    for base, src in REPLACE.items():
        if not os.path.exists(src):
            print("missing replacement", src, file=sys.stderr)
            continue
        source = Image.open(src).convert("RGB")
        for path in find_variants(base):
            orig = backup(path)
            try:
                size = Image.open(orig).size
            except Exception:
                continue
            save_like(cover(source, size), path)
            replaced += 1
    inpainted = 0
    for base, (x0, y0, x1, y1) in INPAINT.items():
        if x1 <= x0:
            continue
        for path in find_variants(base):
            orig = backup(path)
            img = Image.open(orig).convert("RGB")
            w, h = img.size
            box = (int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h))
            bw, bh = box[2] - box[0], box[3] - box[1]
            if bw < 2 or bh < 2:
                continue
            # take the strip just below the logo (same door panel), stretch it over the logo, soften the seam
            strip = img.crop((box[0], min(h - 1, box[3]), box[2], min(h, box[3] + max(2, bh // 3)))).resize((bw, bh), Image.LANCZOS)
            strip = strip.filter(ImageFilter.GaussianBlur(max(1, bw // 40)))
            img.paste(strip, (box[0], box[1]))
            save_like(img, path)
            inpainted += 1
    print(f"clean-photos: {replaced} files replaced, {inpainted} files inpainted")


if __name__ == "__main__":
    main()
