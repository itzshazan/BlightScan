"""BlightScan ML service (spec section 6.1).

Only the Next.js API routes call this service. Every endpoint except /health needs X-API-Key.
"""

import hmac
import io
from contextlib import asynccontextmanager
from typing import Literal
from urllib.parse import urlparse

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

from .config import settings
from .model import LeafModel
from .spread import predict_spread
from .weather import hourly_forecast

state: dict = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    state["model"] = LeafModel(settings.model_dir, settings.model_file, settings.model_version, settings.ood_threshold)
    yield
    state.clear()


app = FastAPI(title="BlightScan ML service", version="1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origin.split(",") if o.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)


def require_key(x_api_key: str | None = Header(default=None)) -> None:
    if not x_api_key or not hmac.compare_digest(x_api_key, settings.ml_api_key):
        raise HTTPException(401, "Invalid API key")


# ---- schemas ------------------------------------------------------------
class PredictIn(BaseModel):
    image_url: str


class SpreadIn(BaseModel):
    disease: Literal["early_blight", "late_blight"]
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    severity: Literal["low", "moderate", "high"] = "moderate"
    recent_cases: int = Field(default=0, ge=0)


# ---- helpers ------------------------------------------------------------
def _open_image(data: bytes) -> Image.Image:
    if len(data) > settings.max_image_bytes:
        raise HTTPException(413, "Image is larger than 6 MB")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
        return img
    except (UnidentifiedImageError, OSError):
        raise HTTPException(400, "Could not read that image")


def _fetch_image(url: str) -> bytes:
    parsed = urlparse(url)
    if parsed.scheme not in ("https", "http"):
        raise HTTPException(400, "image_url must be http(s)")
    if settings.allowed_image_host and parsed.hostname != settings.allowed_image_host:
        raise HTTPException(400, "image_url host is not allowed")
    try:
        with httpx.stream("GET", url, timeout=settings.image_timeout_s, follow_redirects=False) as r:
            r.raise_for_status()
            chunks, size = [], 0
            for chunk in r.iter_bytes():
                size += len(chunk)
                if size > settings.max_image_bytes:
                    raise HTTPException(413, "Image is larger than 6 MB")
                chunks.append(chunk)
            return b"".join(chunks)
    except httpx.HTTPError as e:
        raise HTTPException(400, f"Could not download image: {e.__class__.__name__}")


# ---- endpoints ----------------------------------------------------------
@app.get("/health")
def health():
    model: LeafModel | None = state.get("model")
    return {
        "status": "ok" if model else "loading",
        "model_version": settings.model_version,
        "ood_check": bool(model and model.centroids is not None),
    }


@app.post("/predict", dependencies=[Depends(require_key)])
async def predict(request: Request):
    """JSON {"image_url": "<signed URL>"} or multipart form with a `file` field."""
    ctype = request.headers.get("content-type", "")
    if ctype.startswith("multipart/form-data"):
        form = await request.form()
        upload = form.get("file")
        if upload is None or isinstance(upload, str):
            raise HTTPException(400, "Missing file field")
        data = await upload.read()
    else:
        body = PredictIn.model_validate(await request.json())
        data = _fetch_image(body.image_url)
    img = _open_image(data)
    return state["model"].predict(img)


@app.post("/predict-spread", dependencies=[Depends(require_key)])
def predict_spread_endpoint(body: SpreadIn):
    try:
        hourly = hourly_forecast(body.latitude, body.longitude, settings.weather_timeout_s)
    except httpx.HTTPError:
        raise HTTPException(502, "Weather service unavailable")
    return predict_spread(body.disease, body.severity, body.recent_cases, hourly)
