"""Diseased leaf-area estimate: the share of the leaf that isn't healthy green.

Follows the ImageJ procedure in Dhar et al. (2025), Results in Engineering 28, 107739, done
automatically: segment the leaf by colour, clean the mask with erosion/dilation, mark the lesion
pixels (yellow, brown, dark or grey tissue) inside it, and divide lesion pixels by leaf pixels.
Severity bands are the paper's: < 25 % low, 25–50 % moderate (the paper's "medium"), > 50 % high.

It is a colour rule, not a trained model. It is reliable on one leaf against a plain background (the
photos the classifier expects too) and rough on busy field photos, so the result says which it is.
"""

import base64
import io

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ANALYSIS_SIZE = 256  # long side, px; enough for lesions and fast on a free CPU
MASK_RGBA = (225, 29, 72, 170)  # lesion overlay colour, ~67 % opaque

# Hue in degrees, saturation/value in 0–1
GREEN_HUE = (62, 170)  # healthy tissue; below 62° is yellowing, above 170° isn't leaf
MIN_SAT_GREEN = 0.15
MIN_SAT_LESION = 0.25  # stricter, so beige/grey backgrounds don't count as brown tissue
MIN_VAL = 0.10
NECROTIC_VAL = 0.22  # darker than this inside the leaf: dead tissue
GLARE_VAL, GLARE_SAT = 0.85, 0.20  # bright, washed-out spots: reflections, treated as healthy
EDGE_PX, MAX_EDGE_LESION = 6, 0.12  # more "lesion" than this along the photo's border = busy background


def grade(diseased_pct: float) -> str:
    if diseased_pct < 25:
        return "low"
    return "moderate" if diseased_pct <= 50 else "high"


def _hsv(img: Image.Image) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    hsv = np.asarray(img.convert("HSV"), dtype=np.float32)
    return hsv[..., 0] * (360 / 255), hsv[..., 1] / 255, hsv[..., 2] / 255


def _morph(mask: np.ndarray, *ops: str) -> np.ndarray:
    # "close" = dilate then erode (joins gaps), "open" = erode then dilate (drops specks),
    # "erode" = shrink by one pixel; 3×3 kernel
    steps = {
        "close": (ImageFilter.MaxFilter(3), ImageFilter.MinFilter(3)),
        "open": (ImageFilter.MinFilter(3), ImageFilter.MaxFilter(3)),
        "erode": (ImageFilter.MinFilter(3),),
    }
    im = Image.fromarray(mask.astype(np.uint8) * 255)
    for op in ops:
        for f in steps[op]:
            im = im.filter(f)
    return np.asarray(im) > 127


def _fill_holes(mask: np.ndarray) -> np.ndarray:
    # Flood the background from a 1 px border; whatever the flood can't reach is inside the leaf
    # (dark or grey lesions the colour rule missed).
    # .copy(): fromarray() images share the array's memory read-only, and floodfill silently skips those
    padded = Image.fromarray(np.pad(mask, 1).astype(np.uint8) * 255).copy()
    ImageDraw.floodfill(padded, (0, 0), 128)
    return (np.asarray(padded) != 128)[1:-1, 1:-1]


def _mask_data_url(lesion: np.ndarray) -> str:
    im = Image.fromarray(lesion.astype(np.uint8), "P")
    im.putpalette([0, 0, 0, *MASK_RGBA[:3]])
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True, transparency=bytes([0, MASK_RGBA[3]]))
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def estimate(img: Image.Image) -> dict:
    """% of leaf area with lesions, its severity band, and a lesion mask aligned with the full photo."""
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((ANALYSIS_SIZE, ANALYSIS_SIZE), Image.Resampling.BILINEAR)
    h, s, v = _hsv(img)

    green_hue = (h >= GREEN_HUE[0]) & (h <= GREEN_HUE[1])
    green = green_hue & (s >= MIN_SAT_GREEN) & (v >= MIN_VAL)
    tinted = ((h < GREEN_HUE[0]) | (h >= 340)) & (s >= MIN_SAT_LESION) & (v >= MIN_VAL)  # yellow → red-brown
    leaf = _fill_holes(_morph(green | tinted, "close", "open"))

    leaf_frac = float(leaf.mean())
    if leaf.sum() < 200:  # too little plant tissue to measure
        return {"diseased_area": None, "severity_reliable": False, "lesion_mask": None}

    # Lesions: yellow/brown tissue anywhere on the leaf; dark dead tissue and grey tissue (late-blight
    # mould, dried patches) only away from the edge, where shadows and the background blend in.
    # Pale or deeply shaded green (hairy, shiny or curled surface) and reflections count as healthy.
    glare = (v >= GLARE_VAL) & (s <= GLARE_SAT)
    necrotic = (v < NECROTIC_VAL) & ~(green_hue & (s >= 0.3))
    grey = ~green_hue & (s < MIN_SAT_LESION)
    core = _morph(leaf, "erode", "erode")
    lesion = ((leaf & tinted) | (core & (necrotic | grey))) & ~glare
    lesion = np.asarray(Image.fromarray(lesion.astype(np.uint8) * 255).filter(ImageFilter.MedianFilter(3))) > 127
    lesion &= leaf

    # Brown/yellow along the photo's edge is soil, hands or dead plants rather than lesions, and a leaf
    # that fills the frame means there's no clear background to separate it from.
    edge = np.zeros_like(lesion)
    edge[:EDGE_PX], edge[-EDGE_PX:], edge[:, :EDGE_PX], edge[:, -EDGE_PX:] = True, True, True, True
    edge_lesion = float(lesion[edge].mean())

    pct = round(float(lesion.sum() / leaf.sum() * 100), 1)
    return {
        "diseased_area": pct,
        "severity_reliable": 0.05 <= leaf_frac <= 0.92 and edge_lesion < MAX_EDGE_LESION,
        "lesion_mask": _mask_data_url(lesion),
    }
