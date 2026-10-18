# BlightScan

Photograph a tomato leaf, get a Healthy / Early Blight / Late Blight diagnosis with a confidence score, and see a 7-day spread-risk forecast for the field. B.Tech CSE (AI & ML) project, Manav Rachna University.

| Folder | What | Hosted on |
| --- | --- | --- |
| [`web/`](web/) | Next.js 14 frontend and API routes | Vercel |
| [`ml-service/`](ml-service/) | FastAPI with a pretrained leaf-disease model (ONNX) and the spread forecast | Hugging Face Spaces or Render |
| [`supabase/`](supabase/) | Schema, security policies, storage and seed data | Supabase |

```
Browser ──login, photo upload──▶ Supabase (Auth · Postgres · Storage)
   │ POST /api/scans                         ▲ save scan + forecast (service role)
   ▼                                         │
Next.js API routes ──signed URL + X-API-Key──▶ FastAPI ML service ──▶ Open-Meteo
```

## Getting it running

1. **Web app, demo mode.** Runs with no keys; data stays in your browser.
   ```bash
   cd web && npm install && npm run dev
   ```
2. **ML service.** Follow [ml-service/README.md](ml-service/README.md): `pip install`, `python scripts/download_model.py`, `uvicorn app.main:app --port 7860`.
3. **Supabase.** Follow [supabase/README.md](supabase/README.md): run the 4 migrations, then paste the keys into `web/.env.local`.
4. **Restart `npm run dev`.** With the Supabase keys set, the app switches to real accounts, storage and the model automatically.

`ML_API_KEY` is already generated and matches in `ml-service/.env` and `web/.env.local`. Both files are git-ignored.

Spec: [BlightScan_Website_Full_Spec.md](BlightScan_Website_Full_Spec.md) · Page layouts: [BlightScan_Website_Layout.md](BlightScan_Website_Layout.md)
