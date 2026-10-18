import io
import os
from pathlib import Path

import pytest

os.environ.setdefault("ML_API_KEY", "test-key")

from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
pytestmark = pytest.mark.skipif(not (MODEL_DIR / "model.onnx").exists(), reason="run scripts/download_model.py first")


@pytest.fixture(scope="module")
def client():
    from app.main import app

    with TestClient(app) as c:
        yield c


def png(color=(60, 140, 60)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (320, 240), color).save(buf, "PNG")
    return buf.getvalue()


def test_health_needs_no_key(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_predict_requires_key(client):
    r = client.post("/predict", files={"file": ("leaf.png", png(), "image/png")})
    assert r.status_code == 401


def test_predict_multipart_shape(client):
    r = client.post("/predict", headers={"X-API-Key": "test-key"}, files={"file": ("leaf.png", png(), "image/png")})
    assert r.status_code == 200
    body = r.json()
    assert body["label"] in {"healthy", "early_blight", "late_blight"}
    assert 0 <= body["confidence"] <= 100
    assert set(body["probabilities"]) == {"healthy", "early_blight", "late_blight", "other"}
    assert body["severity"] in {"low", "moderate", "high"}
    # A flat green rectangle is not a leaf photo.
    assert body["in_domain"] is False
    assert body["note"]


def test_predict_rejects_non_image(client):
    r = client.post("/predict", headers={"X-API-Key": "test-key"}, files={"file": ("x.png", b"not an image", "image/png")})
    assert r.status_code == 400


def test_predict_rejects_bad_url_scheme(client):
    r = client.post("/predict", headers={"X-API-Key": "test-key"}, json={"image_url": "file:///etc/passwd"})
    assert r.status_code == 400


def test_spread_validates_disease(client):
    r = client.post("/predict-spread", headers={"X-API-Key": "test-key"}, json={"disease": "healthy", "latitude": 28.4, "longitude": 77.3})
    assert r.status_code == 422
