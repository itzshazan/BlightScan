"""Evaluate the leaf models on labelled test sets and compare them with McNemar's test.

Each test set is a folder with one sub-folder per BlightScan class (healthy/, early_blight/,
late_blight/), as written by scripts/fetch_eval_data.py. Every image goes through LeafModel.predict,
so the label is exactly what the app would show.

Reports per model and test set: accuracy, per-class precision/recall/F1, macro F1, the confusion
matrix, how often the app would warn (confidence < 60 % or failed leaf check), and model-only
inference time. For every pair of models on the same test set, McNemar's test checks whether their
error rates really differ (as in Dhar et al. 2025, Results in Engineering 28, 107739).

Usage:
    python scripts/download_model.py --mobilenet --dir model-mobilenet
    python scripts/fetch_eval_data.py
    python scripts/evaluate.py --model dinov2=model --model mobilenet=model-mobilenet \
        --data plantdoc=eval-data/plantdoc --data plantvillage=eval-data/plantvillage
Writes eval/results.json and eval/RESULTS.md.
"""

import argparse
import itertools
import json
import math
import sys
import time
from datetime import date
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from app.model import CLASSES, LeafModel  # noqa: E402

NAMES = {"healthy": "Healthy", "early_blight": "Early blight", "late_blight": "Late blight"}
LOW_CONFIDENCE = 60  # the app's "we're not sure" threshold


def pair(text: str) -> tuple[str, Path]:
    name, _, path = text.partition("=")
    if not path:
        raise argparse.ArgumentTypeError("use name=path")
    return name, (ROOT / path).resolve() if not Path(path).is_absolute() else Path(path)


def load_images(folder: Path) -> list[tuple[Path, str]]:
    items = [(p, c) for c in CLASSES for p in sorted((folder / c).glob("*")) if p.suffix.lower() in (".jpg", ".jpeg", ".png")]
    if not items:
        raise SystemExit(f"No images in {folder}/<class>/ (run scripts/fetch_eval_data.py)")
    return items


def run(model: LeafModel, images: list[tuple[Path, str]]) -> list[dict]:
    rows = []
    for path, truth in images:
        try:
            img = Image.open(path)
            img.load()
        except OSError:
            continue  # unreadable file: skipped for every model alike, since files are read in the same order
        r = model.predict(img)
        x = model.preprocess(img)
        t0 = time.perf_counter()
        model.session.run(None, {model.input_name: x})
        rows.append(
            {
                "file": path.name,
                "truth": truth,
                "pred": r["label"],
                "confidence": r["confidence"],
                "warned": r["confidence"] < LOW_CONFIDENCE or not r["in_domain"],
                "model_ms": (time.perf_counter() - t0) * 1000,
            }
        )
    return rows


def metrics(rows: list[dict]) -> dict:
    idx = {c: i for i, c in enumerate(CLASSES)}
    cm = np.zeros((3, 3), dtype=int)  # rows = true class, columns = predicted class
    for r in rows:
        cm[idx[r["truth"]], idx[r["pred"]]] += 1
    per_class = {}
    for c, i in idx.items():
        tp, fp, fn = cm[i, i], cm[:, i].sum() - cm[i, i], cm[i, :].sum() - cm[i, i]
        p = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        per_class[c] = {"precision": p, "recall": rec, "f1": 2 * p * rec / (p + rec) if p + rec else 0.0, "support": int(cm[i, :].sum())}
    correct = [r for r in rows if r["pred"] == r["truth"]]
    trusted = [r for r in rows if not r["warned"]]
    return {
        "n": len(rows),
        "accuracy": len(correct) / len(rows),
        "macro_precision": float(np.mean([v["precision"] for v in per_class.values()])),
        "macro_recall": float(np.mean([v["recall"] for v in per_class.values()])),
        "macro_f1": float(np.mean([v["f1"] for v in per_class.values()])),
        "per_class": per_class,
        "confusion_matrix": {"labels": list(CLASSES), "rows_true_cols_pred": cm.tolist()},
        "warned_share": 1 - len(trusted) / len(rows),
        # Accuracy on the results the app shows without a "not sure" warning
        "accuracy_when_not_warned": (sum(r["pred"] == r["truth"] for r in trusted) / len(trusted)) if trusted else None,
        "model_ms_median": float(np.median([r["model_ms"] for r in rows])),
    }


def mcnemar(a: list[dict], b: list[dict]) -> dict:
    """b01: only A correct; b10: only B correct. Chi-square with continuity correction, df = 1;
    exact two-sided binomial p-value when there are fewer than 25 disagreements."""
    assert [r["file"] for r in a] == [r["file"] for r in b]
    only_a = sum(x["pred"] == x["truth"] and y["pred"] != y["truth"] for x, y in zip(a, b))
    only_b = sum(x["pred"] != x["truth"] and y["pred"] == y["truth"] for x, y in zip(a, b))
    n = only_a + only_b
    if n == 0:
        return {"only_first_correct": 0, "only_second_correct": 0, "chi2": 0.0, "p_value": 1.0, "method": "no disagreements", "significant": False}
    chi2 = (abs(only_a - only_b) - 1) ** 2 / n
    if n < 25:
        k = min(only_a, only_b)
        p = min(1.0, 2 * sum(math.comb(n, i) for i in range(k + 1)) / 2**n)
        method = "exact binomial"
    else:
        p = math.erfc(math.sqrt(chi2 / 2))  # survival function of chi-square with 1 df
        method = "chi-square, continuity corrected"
    return {"only_first_correct": only_a, "only_second_correct": only_b, "chi2": round(chi2, 3), "p_value": p, "method": method, "significant": p < 0.05}


def pct(v: float | None) -> str:
    return "–" if v is None else f"{v * 100:.1f}%"


def report(results: dict) -> str:
    out = [
        "# Model evaluation",
        "",
        f"Generated by `scripts/evaluate.py` on {results['date']}. Labels are what the app shows: the most likely of",
        "healthy / early blight / late blight. \"Warned\" means the app would show its \"we're not sure\" message",
        "(confidence below 60 % or the photo failed the single-leaf check).",
        "",
    ]
    for ds, info in results["datasets"].items():
        out += [f"## {ds} ({info['n']} images: {', '.join(f'{NAMES[c]} {k}' for c, k in info['counts'].items())})", ""]
        out += ["| Model | Accuracy | Macro precision | Macro recall | Macro F1 | Warned | Accuracy when not warned | Model time (median) |", "|---|---|---|---|---|---|---|---|"]
        for m, r in info["models"].items():
            out.append(
                f"| {m} | {pct(r['accuracy'])} | {r['macro_precision']:.3f} | {r['macro_recall']:.3f} | {r['macro_f1']:.3f} | {pct(r['warned_share'])} | {pct(r['accuracy_when_not_warned'])} | {r['model_ms_median']:.0f} ms |"
            )
        for m, r in info["models"].items():
            cm = r["confusion_matrix"]["rows_true_cols_pred"]
            out += ["", f"**{m}**: confusion matrix (rows: true class, columns: predicted) and per-class scores", ""]
            out += ["| True \\ Predicted | " + " | ".join(NAMES[c] for c in CLASSES) + " | Precision | Recall | F1 |", "|---|---|---|---|---|---|---|"]
            for c, row in zip(CLASSES, cm):
                pc = r["per_class"][c]
                out.append(f"| {NAMES[c]} | " + " | ".join(str(v) for v in row) + f" | {pc['precision']:.2f} | {pc['recall']:.2f} | {pc['f1']:.2f} |")
        if info["mcnemar"]:
            out += ["", "McNemar's test (p < 0.05: the two models' error rates differ significantly)", ""]
            out += ["| Models | Only first correct | Only second correct | χ² | p | Significant |", "|---|---|---|---|---|---|"]
            for k, t in info["mcnemar"].items():
                out.append(f"| {k} | {t['only_first_correct']} | {t['only_second_correct']} | {t['chi2']} | {t['p_value']:.3g} | {'yes' if t['significant'] else 'no'} |")
        out.append("")
    return "\n".join(out)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=pair, action="append", required=True, help="name=model_dir (repeat)")
    parser.add_argument("--data", type=pair, action="append", required=True, help="name=folder with healthy/, early_blight/, late_blight/ (repeat)")
    parser.add_argument("--out", type=Path, default=ROOT / "eval")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252, which has no χ

    models = {name: LeafModel(d, "model.onnx", name) for name, d in args.model}
    results = {"date": date.today().isoformat(), "datasets": {}}
    for ds, folder in args.data:
        images = load_images(folder)
        runs = {}
        for name, m in models.items():
            print(f"{ds} · {name}: {len(images)} images ...", flush=True)
            runs[name] = run(m, images)
        results["datasets"][ds] = {
            "n": len(next(iter(runs.values()))),
            "counts": {c: sum(1 for _, t in images if t == c) for c in CLASSES},
            "models": {name: metrics(rows) for name, rows in runs.items()},
            "mcnemar": {f"{a} vs {b}": mcnemar(runs[a], runs[b]) for a, b in itertools.combinations(runs, 2)},
        }

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "results.json").write_text(json.dumps(results, indent=2))
    (args.out / "RESULTS.md").write_text(report(results), encoding="utf-8")
    print(report(results))
    return 0


if __name__ == "__main__":
    sys.exit(main())
