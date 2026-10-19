---
title: BlightScan ML
emoji: 🍅
colorFrom: green
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# BlightScan ML service

FastAPI service that diagnoses tomato leaves and forecasts spread risk (spec section 6.1). Only the Next.js API routes call it; every endpoint except `/health` needs the `X-API-Key` header.

## Model

No training needed. The service uses a pretrained PlantVillage classifier:

| | Default | Fallback |
| --- | --- | --- |
| Model | [rodynaemad/plant-disease-dinov2-small](https://huggingface.co/rodynaemad/plant-disease-dinov2-small) | [linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification](https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification) |
| Reported accuracy | 98.7% (int8), on leaves never seen in training | 95.4%, random photo split |
| File | 24 MB int8 ONNX | 9 MB ONNX |
| Rejects non-leaf photos | Yes (centroid similarity check) | No |
| Licence | CC BY-SA 4.0 (credit the author) | "other" (see model card) |

Accuracy figures are the model authors' own, measured on PlantVillage lab photos. Real field photos will score lower.

Both models predict 38 PlantVillage classes. The service reports only BlightScan's three:

- `probabilities`: the model's own probabilities for healthy, early blight and late blight, plus `other` for everything else.
- `confidence`: the probability of the chosen class. A leaf that looks like another disease therefore gets a low confidence, and the app shows its "we're not sure" warning.
- `note`: explains the low confidence, for example "This looks most like Tomato: Septoria leaf spot (97%), which BlightScan does not cover", or that the photo doesn't look like a single leaf.

Sanity check on 20 PlantVillage sample photos (which may overlap the model's training data):

- **Correct labels:** 15 of 15 early blight, late blight and healthy leaves, about 130 ms each on CPU.
- **Septoria leaf spot:** confidence near 0%, with the explanatory note.
- **Screenshots:** flagged as not a leaf.

## Run locally

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
python scripts/download_model.py  # add --mobilenet for the fallback model
uvicorn app.main:app --port 7860
pytest                            # 21 tests
```

`.env` holds `ML_API_KEY`. It must match `ML_API_KEY` in `web/.env.local`.

## Severity (diseased leaf area)

`app/severity.py` measures the share of the leaf with lesions from leaf colour, following the ImageJ procedure in Dhar et al. (2025), *Results in Engineering* 28, 107739: segment the leaf, clean it with erosion/dilation, mark yellow, brown, dark and grey tissue inside it, divide by the leaf area. The bands are the paper's: under 25 % low, 25–50 % moderate, over 50 % high. `/predict` returns `diseased_area`, a `lesion_mask` PNG for the result page, and `severity_reliable`, which is false for busy backgrounds or photos that fail the single-leaf check; severity then falls back to moderate.

## Evaluate

```bash
python scripts/download_model.py --mobilenet --dir model-mobilenet   # second model to compare against
python scripts/fetch_eval_data.py                                    # 262 PlantDoc field + 450 PlantVillage lab photos
python scripts/evaluate.py --model dinov2=model --model mobilenet=model-mobilenet \
    --data plantdoc=eval-data/plantdoc --data plantvillage=eval-data/plantvillage
```

Writes accuracy, precision/recall/F1, confusion matrices, warning rates, inference time and McNemar's test for each model pair to [eval/RESULTS.md](eval/RESULTS.md) and `eval/results.json`. The website's figures (`web/lib/site.ts`, `evaluation`) come from that file.

## Endpoints

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health` | none | `{status, model_version, ood_check}` |
| POST | `/predict` | `{"image_url": "<signed URL>"}` or multipart `file` | `{label, confidence, probabilities, severity, diseased_area, severity_reliable, lesion_mask, model_version, inference_ms, in_domain, note, top_class, …}` |
| POST | `/predict-spread` | `{disease, latitude, longitude, severity, recent_cases}` | `{risk_level, risk_score, forecast[7], weather[7], summary}` |

`/predict-spread` fetches hourly weather from Open-Meteo and applies spec section 7. `web/lib/spread.ts` is the same algorithm for demo mode; keep them in sync.

## Settings (`.env`)

| Variable | Purpose |
| --- | --- |
| `ML_API_KEY` | Shared secret with the web app (required) |
| `ALLOWED_ORIGIN` | Your Vercel URL, for CORS |
| `ALLOWED_IMAGE_HOST` | e.g. `abcd1234.supabase.co`: only download images from your Supabase storage |
| `MODEL_VERSION` | Defaults to `dinov2-small-plantvillage-int8`. Set `mobilenet-v2-plantvillage` if you downloaded the fallback. Must match a row in `model_versions`. |

## Deploy

**Hugging Face Spaces (recommended, free, 16 GB RAM)**

1. Create a Space with the **Docker** SDK.
2. Push the contents of `ml-service/` to it. This README's front-matter configures the Space.
3. In the Space settings, add the secrets `ML_API_KEY`, `ALLOWED_ORIGIN` and `ALLOWED_IMAGE_HOST`.
4. Set `ML_API_URL` in Vercel to `https://<user>-<space>.hf.space`.

**Render:** create a new Web Service with Docker and the same environment variables. Render sets `PORT` itself.

Free tiers sleep when idle, so the first request can take 30–60 s. Open `/health` before a demo.
