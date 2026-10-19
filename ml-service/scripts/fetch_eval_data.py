"""Download the evaluation images into eval-data/ (git-ignored).

Two test sets, both pinned to exact commits so the numbers can be reproduced:

  * plantdoc/      every healthy, early-blight and late-blight tomato photo in PlantDoc (train + test
                   splits, 262 images). Real field photos the models never trained on: busy backgrounds,
                   several leaves, mixed light. Used as published, including PlantDoc's known label
                   noise (e.g. a basil photo in "Tomato leaf").
  * plantvillage/  a fixed sample of PlantVillage lab photos (one leaf on a plain background), 150 per
                   class by default. Both models were trained on PlantVillage, so some of these may
                   be training images and the scores can be optimistic.

Usage:
    python scripts/fetch_eval_data.py              # both sets
    python scripts/fetch_eval_data.py --per-class 300

Uses the GitHub API to list folders (60 requests/hour without a token; this needs 9).
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "eval-data"

PLANTDOC = ("pratikkayal/PlantDoc-Dataset", "5467f6012d78d1c446145d5f582da6096f852ae8")
PLANTVILLAGE = ("spMohanty/PlantVillage-Dataset", "7f7ecc7e1eaca78107e3affe7cb5abd9427e139a")

PLANTDOC_FOLDERS = {
    "healthy": ["train/Tomato leaf", "test/Tomato leaf"],
    "early_blight": ["train/Tomato Early blight leaf", "test/Tomato Early blight leaf"],
    "late_blight": ["train/Tomato leaf late blight", "test/Tomato leaf late blight"],
}
PLANTVILLAGE_FOLDERS = {
    "healthy": "raw/color/Tomato___healthy",
    "early_blight": "raw/color/Tomato___Early_blight",
    "late_blight": "raw/color/Tomato___Late_blight",
}
IMAGE_EXT = (".jpg", ".jpeg", ".png")


def list_folder(repo: str, ref: str, path: str) -> list[dict]:
    url = f"https://api.github.com/repos/{repo}/contents/{urllib.parse.quote(path)}?ref={ref}"
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "blightscan-eval"})
    with urllib.request.urlopen(req, timeout=60) as r:
        items = json.load(r)
    return sorted((i for i in items if i["type"] == "file" and i["name"].lower().endswith(IMAGE_EXT)), key=lambda i: i["name"])


def fetch(repo: str, ref: str, items: list[dict], dest: Path) -> int:
    dest.mkdir(parents=True, exist_ok=True)
    n = 0
    for i, item in enumerate(items):
        # Index prefix keeps names unique across PlantDoc's train/test folders
        target = dest / f"{i:04d}{Path(item['name']).suffix.lower()}"
        if not target.exists():
            # Built from the path: the API's download_url doesn't escape names that contain "%"
            url = f"https://raw.githubusercontent.com/{repo}/{ref}/{urllib.parse.quote(item['path'])}"
            with urllib.request.urlopen(url, timeout=60) as r:
                target.write_bytes(r.read())
        n += 1
    return n


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-class", type=int, default=150, help="PlantVillage images per class (default 150)")
    args = parser.parse_args()

    repo, ref = PLANTDOC
    for label, folders in PLANTDOC_FOLDERS.items():
        items = [i for f in folders for i in list_folder(repo, ref, f)]
        print(f"plantdoc/{label}: {fetch(repo, ref, items, OUT / 'plantdoc' / label)}")

    repo, ref = PLANTVILLAGE
    for label, folder in PLANTVILLAGE_FOLDERS.items():
        items = list_folder(repo, ref, folder)  # the API lists the first 1000, sorted by name
        step = max(1, len(items) // args.per_class)
        print(f"plantvillage/{label}: {fetch(repo, ref, items[::step][: args.per_class], OUT / 'plantvillage' / label)}")
    print(f"Done: {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
