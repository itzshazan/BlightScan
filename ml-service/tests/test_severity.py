import base64
import io

from PIL import Image, ImageDraw

from app.model import severity_for
from app.severity import estimate, grade

BACKGROUND = (205, 205, 210)  # light grey, like PlantVillage
LEAF = (60, 140, 60)
LESION = (110, 70, 30)  # brown


def leaf_photo(lesion_fraction: float = 0.0) -> Image.Image:
    """A green ellipse on grey, with a brown lesion covering roughly `lesion_fraction` of it."""
    img = Image.new("RGB", (400, 300), BACKGROUND)
    d = ImageDraw.Draw(img)
    d.ellipse((80, 50, 320, 250), fill=LEAF)
    if lesion_fraction:
        # Brown band across the leaf's middle; the leaf is 240 px wide, so width ∝ fraction
        w = 240 * lesion_fraction
        d.rectangle((200 - w / 2, 50, 200 + w / 2, 250), fill=LESION)
        d.ellipse((80, 50, 320, 250), outline=LEAF, width=6)  # keep a green rim like a real leaf
    return img


def test_grade_bands_follow_the_paper():
    assert grade(0) == "low"
    assert grade(24.9) == "low"
    assert grade(25) == "moderate"
    assert grade(50) == "moderate"
    assert grade(50.1) == "high"


def test_healthy_leaf_has_no_lesions():
    r = estimate(leaf_photo())
    assert r["diseased_area"] < 2
    assert r["severity_reliable"] is True


def test_lesion_area_is_measured():
    small, large = estimate(leaf_photo(0.15)), estimate(leaf_photo(0.6))
    assert 8 < small["diseased_area"] < 25
    assert large["diseased_area"] > 45
    assert small["severity_reliable"] and large["severity_reliable"]


def test_mask_matches_photo_shape():
    r = estimate(leaf_photo(0.3))
    assert r["lesion_mask"].startswith("data:image/png;base64,")
    mask = Image.open(io.BytesIO(base64.b64decode(r["lesion_mask"].split(",", 1)[1])))
    assert abs(mask.width / mask.height - 400 / 300) < 0.02
    assert len(r["lesion_mask"]) < 8000  # stored with every scan


def test_brown_background_is_flagged():
    # Leaf on soil: the brown around the edge must not pass as a measurement
    img = Image.new("RGB", (400, 300), (120, 85, 50))
    ImageDraw.Draw(img).ellipse((80, 50, 320, 250), fill=LEAF)
    assert estimate(img)["severity_reliable"] is False


def test_no_leaf_returns_nothing():
    r = estimate(Image.new("RGB", (300, 300), BACKGROUND))
    assert r["diseased_area"] is None and r["lesion_mask"] is None


def test_severity_for_falls_back_when_unreliable():
    measured = {"diseased_area": 60.0, "severity_reliable": True, "lesion_mask": "x"}
    assert severity_for("early_blight", measured, in_domain=True) == ("high", True)
    assert severity_for("early_blight", measured, in_domain=False) == ("moderate", False)
    assert severity_for("healthy", measured, in_domain=True) == ("low", True)
    rough = {**measured, "severity_reliable": False}
    assert severity_for("late_blight", rough, in_domain=True) == ("moderate", False)
