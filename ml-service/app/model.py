"""Pretrained PlantVillage classifier (ONNX) narrowed to BlightScan's three classes.

The model predicts 38 crop/condition classes. BlightScan reports only Healthy, Early Blight and
Late Blight for tomato, so:
  * probabilities are the model's own softmax values for those three classes (they need not sum
    to 1; the rest is returned as "other"),
  * confidence is the softmax probability of the chosen class, so a leaf that looks like another
    disease gets a low confidence and the app shows its "we're not sure" warning,
  * a note explains why when the photo looks like something BlightScan doesn't cover.
"""

import json
import re
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

CLASSES = ("healthy", "early_blight", "late_blight")

# Match tomato labels from either model's naming scheme
# ("Tomato___Early_blight" or "Tomato with Early Blight" / "Healthy Tomato Plant").
_PATTERNS = {
    "healthy": re.compile(r"(?=.*tomato)(?=.*healthy)", re.I),
    "early_blight": re.compile(r"(?=.*tomato)(?=.*early[ _]?blight)", re.I),
    "late_blight": re.compile(r"(?=.*tomato)(?=.*late[ _]?blight)", re.I),
}

_RESAMPLE = {0: Image.Resampling.NEAREST, 1: Image.Resampling.LANCZOS, 2: Image.Resampling.BILINEAR, 3: Image.Resampling.BICUBIC}


def pretty_label(raw: str) -> str:
    if "___" in raw:
        crop, cond = raw.split("___", 1)
        cond = cond.replace("_", " ").strip()
        crop = crop.replace("_", " ").replace(",", "").strip()
        return f"{crop}: {cond[0].upper()}{cond[1:]}"
    return raw


def severity_for(label: str, confidence: float) -> str:
    # Spec 6.1 placeholder rule; replace with a lesion-area estimate if segmentation is added.
    if label == "healthy":
        return "low"
    return "high" if confidence > 85 else "moderate"


@dataclass
class Preprocess:
    shortest_edge: int
    crop_h: int
    crop_w: int
    mean: np.ndarray
    std: np.ndarray
    rescale: float
    resample: Image.Resampling

    @classmethod
    def from_config(cls, cfg: dict) -> "Preprocess":
        size = cfg.get("size", {})
        crop = cfg.get("crop_size", {"height": 224, "width": 224})
        return cls(
            shortest_edge=size.get("shortest_edge") or min(size.get("height", 224), size.get("width", 224)),
            crop_h=crop["height"],
            crop_w=crop["width"],
            mean=np.array(cfg.get("image_mean", [0.5, 0.5, 0.5]), dtype=np.float32).reshape(3, 1, 1),
            std=np.array(cfg.get("image_std", [0.5, 0.5, 0.5]), dtype=np.float32).reshape(3, 1, 1),
            rescale=cfg.get("rescale_factor", 1 / 255),
            resample=_RESAMPLE.get(cfg.get("resample", 2), Image.Resampling.BILINEAR),
        )

    def __call__(self, img: Image.Image) -> np.ndarray:
        # Same steps as the Hugging Face image processor the model was trained with.
        img = ImageOps.exif_transpose(img).convert("RGB")  # phone photos carry rotation in EXIF
        w, h = img.size
        s = self.shortest_edge / min(w, h)
        img = img.resize((max(self.crop_w, round(w * s)), max(self.crop_h, round(h * s))), self.resample)
        w, h = img.size
        left, top = (w - self.crop_w) // 2, (h - self.crop_h) // 2
        img = img.crop((left, top, left + self.crop_w, top + self.crop_h))
        x = np.asarray(img, dtype=np.float32).transpose(2, 0, 1) * self.rescale
        x = (x - self.mean) / self.std
        return x[np.newaxis].astype(np.float32)


class LeafModel:
    def __init__(self, model_dir: Path, model_file: str, version: str, ood_threshold: float | None = None):
        self.version = version
        cfg = json.loads((model_dir / "config.json").read_text())
        self.labels: list[str] = [cfg["id2label"][str(i)] for i in range(len(cfg["id2label"]))]
        self.index = {}
        for cls, pat in _PATTERNS.items():
            hits = [i for i, l in enumerate(self.labels) if pat.search(l)]
            if len(hits) != 1:
                raise RuntimeError(f"Could not find a unique tomato '{cls}' label in the model (found {hits})")
            self.index[cls] = hits[0]

        self.preprocess = Preprocess.from_config(json.loads((model_dir / "preprocessor_config.json").read_text()))

        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2  # free hosting tiers have 1–2 vCPUs
        self.session = ort.InferenceSession(str(model_dir / model_file), opts, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        outputs = [o.name for o in self.session.get_outputs()]
        self.has_features = "features" in outputs

        # Optional out-of-distribution check (DINOv2 model only).
        self.centroids = None
        self.threshold = ood_threshold
        meta_path, cent_path = model_dir / "meta.json", model_dir / "centroids.f32"
        if self.has_features and meta_path.exists() and cent_path.exists():
            meta = json.loads(meta_path.read_text())
            if meta["labels"] != self.labels:
                raise RuntimeError("centroids.f32 label order does not match the model")
            self.centroids = np.fromfile(cent_path, dtype=np.float32).reshape(len(self.labels), meta["dim"])
            self.threshold = self.threshold if self.threshold is not None else float(meta["threshold"])

    def _similarity(self, features: np.ndarray) -> float | None:
        # Centroids are unit-normalised; cosine similarity = dot / |f|.
        if self.centroids is None:
            return None
        f = features.reshape(-1)
        return float(np.max(self.centroids @ f) / (np.linalg.norm(f) + 1e-12))

    def predict(self, img: Image.Image) -> dict:
        t0 = time.perf_counter()
        x = self.preprocess(img)
        out = dict(zip([o.name for o in self.session.get_outputs()], self.session.run(None, {self.input_name: x})))
        logits = out["logits"][0].astype(np.float64)
        p = np.exp(logits - logits.max())
        p /= p.sum()

        probs = {c: float(p[i]) for c, i in self.index.items()}
        label = max(probs, key=probs.get)
        confidence = round(probs[label] * 100, 2)
        top = int(np.argmax(p))
        similarity = self._similarity(out["features"]) if self.has_features else None
        in_domain = similarity is None or self.threshold is None or similarity >= self.threshold

        note = None
        if not in_domain:
            note = "This doesn't look like a single-leaf photo the model was trained on. Retake it close up, one leaf, plain background."
        elif top not in self.index.values():
            top_label = self.labels[top]
            if re.search(r"tomato", top_label, re.I):
                note = f"This looks most like {pretty_label(top_label)} ({p[top] * 100:.0f}%), which BlightScan does not cover."
            else:
                note = f"This looks most like {pretty_label(top_label)} ({p[top] * 100:.0f}%). Is it a tomato leaf?"

        return {
            "label": label,
            "confidence": confidence,
            "probabilities": {**{c: round(v, 4) for c, v in probs.items()}, "other": round(max(0.0, 1 - sum(probs.values())), 4)},
            "severity": severity_for(label, confidence),
            "model_version": self.version,
            "inference_ms": int((time.perf_counter() - t0) * 1000),
            "in_domain": in_domain,
            "similarity": None if similarity is None else round(similarity, 4),
            "top_class": self.labels[top],
            "top_score": round(float(p[top]), 4),
            "note": note,
        }
