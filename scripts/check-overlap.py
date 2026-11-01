#!/usr/bin/env python3
"""Measure how many visible sentences a page shares with the same path on tanzania-specialist.com.

Standard library only (no bs4/requests). For every pair the visible text of both pages is
split into sentences; sentences of 8+ words are normalised and compared as sets. The
percentage is shared / ours.

Usage:
  python3 scripts/check-overlap.py                      # live site, default page list
  python3 scripts/check-overlap.py --ours http://localhost:3000   # local build
  python3 scripts/check-overlap.py --verbose /climbing-kilimanjaro/
  python3 scripts/check-overlap.py /about-us/=/about-tanzania-specialist/   # ours=theirs

The competitor's pages are cached in .cache/overlap/ so the "after" run compares against
the same snapshot as the "before" run (delete the cache to refresh).
"""
import argparse
import hashlib
import html
import json
import os
import re
import sys
import urllib.request
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache", "overlap")
THEIRS = "https://tanzania-specialist.com"
OURS = "https://yourtanzaniatrip.com"
MIN_WORDS = 8

# Pages of phase 1 (ours=theirs when the slug differs).
DEFAULT_PAGES = [
    "/",
    "/itineraries/11-days-safari-trip-tanzania-zanzibar/",
    "/itineraries/15-days-trip-tanzania-zanzibar/",
    "/itineraries/9-days-safari-wildebeest-migration-near-the-mara-river/",
    "/itineraries/7-days-safari-tanzania/",
    "/itineraries/machame-route-7-days/",
    "/itineraries/10-days-zanzibar-island/",
    "/itineraries/10-days-safari-mikumi-udzungwa-ruaha-nyerere/",
    "/itineraries/5-day-tanzania-safari-small-group-trip/",
    "/climbing-kilimanjaro/",
    "/great-wildebeest-migration/",
    "/islands/zanzibar-island/",
    "/about-us/=/about-tanzania-specialist/",
    "/hakuna-matata-package/",
    "/faqs/",
    "/contact/",
]

SKIP_TAGS = {"script", "style", "noscript", "template", "svg", "head", "iframe"}


class TextExtractor(HTMLParser):
    """Collects the text of a page, one chunk per block so sentences never run across elements."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.chunks = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skip += 1
        self.chunks.append("\n")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self.skip:
            self.skip -= 1
        self.chunks.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.chunks.append(data)


def visible_text(page_html):
    p = TextExtractor()
    p.feed(page_html)
    return "".join(p.chunks)


def sentences(text):
    """Normalised sentences of MIN_WORDS+ words."""
    out = set()
    for block in re.split(r"\n+", text):
        block = html.unescape(block).replace("\xa0", " ")
        for s in re.split(r"(?<=[.!?])\s+", block):
            s = re.sub(r"[^a-z0-9 ]+", " ", s.lower().replace("’", "'"))
            words = s.split()
            if len(words) >= MIN_WORDS:
                out.add(" ".join(words))
    return out


def fetch(url, cache=False):
    key = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".html")
    if cache and os.path.exists(key):
        with open(key, encoding="utf-8", errors="replace") as f:
            return f.read()
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (overlap check; yourtanzaniatrip.com)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode("utf-8", errors="replace")
    if cache:
        os.makedirs(CACHE, exist_ok=True)
        with open(key, "w", encoding="utf-8") as f:
            f.write(body)
    return body


def compare(ours_url, theirs_url, verbose=False):
    try:
        ours = sentences(visible_text(fetch(ours_url)))
    except Exception as e:  # noqa: BLE001
        return {"error": f"ours: {e}"}
    try:
        theirs = sentences(visible_text(fetch(theirs_url, cache=True)))
    except Exception as e:  # noqa: BLE001
        return {"error": f"theirs: {e}"}
    shared = sorted(ours & theirs)
    pct = round(100 * len(shared) / len(ours), 1) if ours else 0.0
    if verbose:
        for s in shared:
            print("   =", s)
    return {"ours": len(ours), "theirs": len(theirs), "shared": len(shared), "pct": pct, "sentences": shared}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pages", nargs="*", help="paths, or ours=theirs pairs (default: the phase-1 list)")
    ap.add_argument("--ours", default=OURS, help="base URL of our site (default %(default)s)")
    ap.add_argument("--theirs", default=THEIRS)
    ap.add_argument("--verbose", action="store_true", help="print the shared sentences")
    ap.add_argument("--json", help="also write the results to this JSON file")
    args = ap.parse_args()
    pages = args.pages or DEFAULT_PAGES
    results = []
    print(f"| Page | Ours | Theirs | Shared | Overlap |\n|---|---|---|---|---|")
    for spec in pages:
        ours_path, _, theirs_path = spec.partition("=")
        theirs_path = theirs_path or ours_path
        r = compare(args.ours.rstrip("/") + ours_path, args.theirs.rstrip("/") + theirs_path, args.verbose)
        r["page"] = ours_path
        results.append(r)
        if "error" in r:
            print(f"| {ours_path} | | | | error: {r['error']} |")
        else:
            print(f"| {ours_path} | {r['ours']} | {r['theirs']} | {r['shared']} | {r['pct']}% |")
        sys.stdout.flush()
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
