from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")

    # Shared secret with the Next.js API routes (header X-API-Key).
    ml_api_key: str
    # Vercel URL allowed by CORS. The browser never calls this service directly, so this is a safety net.
    allowed_origin: str = "http://localhost:3000"

    # Where scripts/download_model.py put the model files.
    model_dir: Path = ROOT / "model"
    model_file: str = "model.onnx"
    model_version: str = "dinov2-small-plantvillage-int8"

    # Out-of-distribution check: cosine similarity to the nearest class centroid.
    # Read from model/meta.json when present; this is only the fallback.
    ood_threshold: float | None = None

    # If set, /predict only downloads images from this host (your Supabase project host).
    allowed_image_host: str | None = None

    weather_timeout_s: float = 15.0
    image_timeout_s: float = 15.0
    max_image_bytes: int = 6 * 1024 * 1024


settings = Settings()  # type: ignore[call-arg]  # ml_api_key comes from the environment
