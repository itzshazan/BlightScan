"""Download the pretrained leaf-disease model into ml-service/model/.

Usage:
    python scripts/download_model.py              # DINOv2-small, int8 ONNX (default, recommended)
    python scripts/download_model.py --mobilenet  # MobileNetV2 fallback (no out-of-distribution check)

Files are pinned to exact commits so a later upload by the model author can't change results silently.
Both models are trained on PlantVillage (38 classes); the service uses the 3 tomato classes it needs.
"""

import argparse
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "model"

DINOV2 = {
    "name": "rodynaemad/plant-disease-dinov2-small (CC BY-SA 4.0)",
    "files": {
        # local name: URL
        "model.onnx": "https://huggingface.co/rodynaemad/plant-disease-dinov2-small/resolve/06ebf5e308e100fd000d738c42b059ebb5f58a16/onnx/model_with_features_quantized.onnx",
        "config.json": "https://huggingface.co/rodynaemad/plant-disease-dinov2-small/resolve/06ebf5e308e100fd000d738c42b059ebb5f58a16/config.json",
        "preprocessor_config.json": "https://huggingface.co/rodynaemad/plant-disease-dinov2-small/resolve/06ebf5e308e100fd000d738c42b059ebb5f58a16/preprocessor_config.json",
        # Out-of-distribution check data, published with the author's demo Space.
        "centroids.f32": "https://huggingface.co/spaces/rodynaemad/plant-disease-scanner/resolve/b26e704bd72c2fe05632ea6f7be680a2eca0d8f5/centroids.f32",
        "meta.json": "https://huggingface.co/spaces/rodynaemad/plant-disease-scanner/resolve/b26e704bd72c2fe05632ea6f7be680a2eca0d8f5/meta.json",
    },
}

MOBILENET = {
    "name": "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification (ONNX export by onnx-community)",
    "files": {
        "model.onnx": "https://huggingface.co/onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX/resolve/95110a1ffcc188d1b5a36524d52e303e40c2403d/onnx/model.onnx",
        "config.json": "https://huggingface.co/onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX/resolve/95110a1ffcc188d1b5a36524d52e303e40c2403d/config.json",
        "preprocessor_config.json": "https://huggingface.co/onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX/resolve/95110a1ffcc188d1b5a36524d52e303e40c2403d/preprocessor_config.json",
    },
}


def download(url: str, dest: Path) -> None:
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(url, timeout=120) as r, open(tmp, "wb") as f:
        shutil.copyfileobj(r, f)
    tmp.replace(dest)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mobilenet", action="store_true", help="use the MobileNetV2 fallback model")
    args = parser.parse_args()
    choice = MOBILENET if args.mobilenet else DINOV2

    if MODEL_DIR.exists():
        shutil.rmtree(MODEL_DIR)
    MODEL_DIR.mkdir(parents=True)

    print(f"Downloading {choice['name']}")
    for name, url in choice["files"].items():
        print(f"  {name} ...", end=" ", flush=True)
        download(url, MODEL_DIR / name)
        print(f"{(MODEL_DIR / name).stat().st_size / 1e6:.1f} MB")
    print(f"Done: {MODEL_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
