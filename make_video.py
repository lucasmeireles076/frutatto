"""Frutatto flavor showcase: product fixed at center over a full-bleed background,
fade-in on the first flavor, then a plain crossfade into each next flavor.
No text, no camera movement, no audio.

Usage: python make_video.py   -> writes frutatto_showcase.mp4
Edit FLAVORS below (order = playback order). Missing files are skipped with a warning.
"""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(ROOT, "asset")

FLAVORS = [
    # (name, background image, product PNG with transparency)
    ("STRAWBERRY", f"{A}/bg_morango.png", f"{A}/morango_suco.png"),
    ("BANANA",     f"{A}/bg_banana.png",  f"{A}/banana_suco.png"),
    ("GRAPE",      f"{A}/bg_uva.png",     f"{A}/uva_suco.png"),
    ("MANGO",      f"{A}/bg_manga.png",   f"{A}/manga_suco.png"),
]
FALLBACK = [("CAJU", f"{A}/bg.png", f"{A}/caju_suco.png")]

W, H, FPS = 1920, 1080, 30
PRODUCT_H = 900          # identical scale for every flavor
HOLD = 3.0               # seconds each flavor is fully visible
XFADE = 0.8              # crossfade between flavors
INTRO_FADE = 0.6         # subtle product fade-in at the very start
OUT = os.path.join(ROOT, "frutatto_showcase.mp4")


def main():
    flavors = [f for f in FLAVORS if os.path.exists(f[1]) and os.path.exists(f[2])]
    for f in FLAVORS:
        if f not in flavors:
            print(f"[skip] {f[0]}: missing {f[1] if not os.path.exists(f[1]) else f[2]}")
    if not flavors:
        print("[info] no flavor assets found, rendering CAJU preview")
        flavors = FALLBACK

    n = len(flavors)
    seg = HOLD + XFADE  # each segment carries the overlap needed by xfade
    inputs, filters = [], []
    for i, (_, bg, prod) in enumerate(flavors):
        dur = seg + (INTRO_FADE if i == 0 else 0)
        inputs += ["-loop", "1", "-t", f"{dur}", "-i", bg,
                   "-loop", "1", "-t", f"{dur}", "-i", prod]
        b, p = 2 * i, 2 * i + 1
        fade = f",fade=in:st=0:d={INTRO_FADE}:alpha=1" if i == 0 else ""
        filters.append(
            f"[{b}:v]scale={W}:{H}:force_original_aspect_ratio=increase,"
            f"crop={W}:{H},setsar=1,fps={FPS},format=rgba[bg{i}];"
            f"[{p}:v]scale=-2:{PRODUCT_H}:flags=lanczos,fps={FPS},format=rgba{fade}[p{i}];"
            f"[bg{i}][p{i}]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[s{i}]"
        )

    last, offset = "s0", seg + INTRO_FADE - XFADE
    for i in range(1, n):
        filters.append(f"[{last}][s{i}]xfade=transition=fade:duration={XFADE}:offset={offset}[x{i}]")
        last, offset = f"x{i}", offset + seg - XFADE

    cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filters),
           "-map", f"[{last}]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "16",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT]
    subprocess.run(cmd, check=True)
    print(f"done: {OUT} ({', '.join(f[0] for f in flavors)})")


if __name__ == "__main__":
    sys.exit(main())
