"""Asset pipeline for the Frutatt landing page.

  python build_assets.py   -> writes optimized layers to site/img/ + site/img/layers.json

What it does
- bg.png: segments the green leaves (HSV key) into independent transparent layers,
  inpaints the holes so the background plate is clean, exports plate + each leaf.
- Products: trims each product PNG to its alpha bbox and exports responsive sizes.
  Drop asset/granola.png and asset/acai.png (transparent PNGs) and re-run; or drop a
  single transparent asset/produtos.png with the three products side by side and it is
  split automatically at the transparent column gaps (left -> right = granola, caju, acai).
- Every image is written as AVIF + WebP at several widths (never upscaled).
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "asset")
OUT = os.path.join(ROOT, "site", "img")
SHARP_NEAR = 150  # Laplacian variance below this = out-of-focus leaf
PRODUCTS = ["granola", "caju", "acai"]
FILE_ALIASES = {"caju": ["caju.png", "caju_suco.png"], "granola": ["granola.png"], "acai": ["acai.png", "açaí.png", "acai_suco.png"]}


def export(img, name, widths, q_avif=55, q_webp=80):
    """Write name-<target>.avif/.webp per target width (never upscaled, so the file may be
    narrower than its name). Stable names let the HTML reference them statically.
    Returns the target widths written."""
    for t in widths:
        w = min(t, img.width)
        h = round(img.height * w / img.width)
        im = img if w == img.width else img.resize((w, h), Image.LANCZOS)
        im.save(os.path.join(OUT, f"{name}-{t}.avif"), quality=q_avif, speed=4)
        im.save(os.path.join(OUT, f"{name}-{t}.webp"), quality=q_webp, method=6)
    return list(widths)


def split_background():
    bgr = cv2.imread(os.path.join(SRC, "bg.png"))
    H, W = bgr.shape[:2]
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    # leaves are the only place where G clearly beats R (yellow: G~R, orange: G<R),
    # so G-R is a soft matte that also captures out-of-focus edges proportionally
    gr = rgb[..., 1] - rgb[..., 0]
    alpha = np.clip((gr - 6) / 50, 0, 1)
    core = (gr > 30).astype(np.uint8) * 255
    core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    hole = cv2.dilate((gr > 2).astype(np.uint8) * 255, np.ones((15, 15), np.uint8))
    plate = cv2.inpaint(bgr, hole, 15, cv2.INPAINT_TELEA)
    plate_rgb = cv2.cvtColor(plate, cv2.COLOR_BGR2RGB).astype(np.float32)

    # decontaminate: pixel = a*leaf + (1-a)*plate  ->  leaf = (pixel - (1-a)*plate) / a
    a3 = np.maximum(alpha, 1e-3)[..., None]
    leaf_rgb = np.clip((rgb - (1 - a3) * plate_rgb) / a3, 0, 255).astype(np.uint8)
    alpha8 = (alpha * 255).astype(np.uint8)

    n, labels, stats, _ = cv2.connectedComponentsWithStats(core)
    leaves = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < 600:
            continue
        region = cv2.dilate((labels == i).astype(np.uint8), np.ones((41, 41), np.uint8))
        pad = 22
        x0, y0 = max(x - pad, 0), max(y - pad, 0)
        x1, y1 = min(x + w + pad, W), min(y + h + pad, H)
        a = alpha8[y0:y1, x0:x1] * region[y0:y1, x0:x1]
        rgba = np.dstack([leaf_rgb[y0:y1, x0:x1], a])
        # blur metric -> depth: soft/out-of-focus leaves sit nearer the camera
        sharp = cv2.Laplacian(cv2.cvtColor(bgr[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
        print(f"  leaf @({x},{y}) sharpness={sharp:.0f}")
        leaves.append({"img": Image.fromarray(rgba, "RGBA"), "box": (x0, y0, x1 - x0, y1 - y0), "sharp": sharp})

    plate_img = Image.fromarray(cv2.cvtColor(plate, cv2.COLOR_BGR2RGB))
    bg_widths = export(plate_img, "bg", [960, 1440, 1920])
    # the orange concentric-circle band (bottom of the art) is reused as the products "floor"
    band = plate_img.crop((0, round(H * 0.70), W, H))
    export(band, "band", [960, 1920])

    # the two crispest leaves double as stable-named "ingredient" sprites for CSS
    for tag, lf in zip("ab", sorted(leaves, key=lambda l: -l["sharp"])[:2]):
        export(lf["img"], f"ingredient-{tag}", [160], q_avif=60, q_webp=82)

    out = []
    for i, lf in enumerate(sorted(leaves, key=lambda l: l["box"][0])):
        name = f"leaf-{i}"
        ws = export(lf["img"], name, [lf["img"].width], q_avif=60, q_webp=82)
        x, y, w, h = lf["box"]
        out.append({
            "name": name, "widths": ws,
            "x": round(x / W * 100, 3), "y": round(y / H * 100, 3),
            "w": round(w / W * 100, 3), "h": round(h / H * 100, 3),
            "near": bool(lf["sharp"] < SHARP_NEAR),  # out-of-focus => foreground layer
        })
    return {"bg": {"widths": bg_widths, "ratio": [W, H]}, "leaves": out}


def find_products():
    found = {}
    for key, names in FILE_ALIASES.items():
        for n in names:
            p = os.path.join(SRC, n)
            if os.path.exists(p):
                found[key] = Image.open(p).convert("RGBA")
                break
    combo = os.path.join(SRC, "produtos.png")
    if os.path.exists(combo):
        im = Image.open(combo).convert("RGBA")
        a = np.array(im.getchannel("A")) > 8
        cols = a.any(axis=0)
        runs, start = [], None
        for x, on in enumerate(list(cols) + [False]):
            if on and start is None:
                start = x
            elif not on and start is not None:
                if x - start > im.width * 0.08:
                    runs.append((start, x))
                start = None
        if len(runs) == 3:
            for key, (x0, x1) in zip(PRODUCTS, runs):
                found.setdefault(key, im.crop((x0, 0, x1, im.height)))
        else:
            print(f"[warn] produtos.png: expected 3 separated products, found {len(runs)} — "
                  "export them as separate transparent PNGs instead")
    return found


def build_products():
    out = {}
    for key, im in find_products().items():
        im = im.crop(im.getchannel("A").getbbox())
        out[key] = {"widths": export(im, f"prod-{key}", [320, 520, 760]), "ratio": [im.width, im.height]}
    for key in PRODUCTS:
        if key not in out:
            print(f"[skip] {key}: no source image in asset/ (placeholder will be shown)")
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))
    data = split_background()
    data["products"] = build_products()
    with open(os.path.join(OUT, "layers.json"), "w") as fh:
        json.dump(data, fh, indent=1)
    # same data as a script so the page also works from file:// (no fetch)
    with open(os.path.join(OUT, "layers.js"), "w") as fh:
        fh.write("window.FRUTATT_LAYERS = " + json.dumps(data) + ";\n")
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"done: {len(os.listdir(OUT))} files, {total / 1024:.0f} KB -> {OUT}")
    print(json.dumps(data, indent=1))


if __name__ == "__main__":
    main()
