#!/usr/bin/env python3
"""Recolours the theme's coloured raster assets to the brand palette.

Usage: recolor-assets.py <src.png> <dst.png> <#hex>
Every non-transparent pixel gets the target colour; alpha (the brush shape) is kept.
"""
import sys
from PIL import Image

src, dst, hexcolor = sys.argv[1], sys.argv[2], sys.argv[3].lstrip("#")
r, g, b = int(hexcolor[0:2], 16), int(hexcolor[2:4], 16), int(hexcolor[4:6], 16)
im = Image.open(src).convert("RGBA")
alpha = im.getchannel("A")
solid = Image.new("RGBA", im.size, (r, g, b, 255))
solid.putalpha(alpha)
solid.save(dst, optimize=True)
print(f"{dst}: {im.size[0]}x{im.size[1]} -> #{hexcolor}")
