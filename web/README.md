# BlightScan — web

Next.js 14 frontend for BlightScan (see `../BlightScan_Website_Full_Spec.md` and `../BlightScan_Website_Layout.md`).

```bash
npm install
npm run dev        # http://localhost:3000
```

## Two modes

The mode is picked automatically from `.env.local`. Restart `npm run dev` after changing it.

| | Demo mode (Supabase keys empty) | Supabase mode (keys set) |
| --- | --- | --- |
| Login | Any email/password. Emails containing `admin` or `expert` get that role (`bs_demo_role` cookie) | Supabase Auth: email/password and Google |
| Data | Seeded from `lib/mock-data.ts`, kept in `localStorage`. **Reset demo data** is in the sidebar | Postgres with Row Level Security; photos in the private `leaf-images` bucket |
| Diagnosis | Colour heuristic in the browser (`lib/predict.ts`), labelled as such | `POST /api/scans` → FastAPI `/predict` (pretrained model) |
| Spread forecast | `lib/spread.ts` with live Open-Meteo weather | FastAPI `/predict-spread`, same algorithm |

Pages don't know which mode they're in. They call `lib/store.ts`, which uses either the local store or `lib/remote.ts` (Supabase and `/api/*`).

## API routes (spec 6.2)

| Route | Used by |
| --- | --- |
| `POST /api/scans` | Analyse Leaf: signed URL → ML `/predict` → insert scan → spread forecast if diseased |
| `DELETE /api/scans/[id]` | Delete Scan (photo and row) |
| `PATCH /api/scans/[id]/review` | Request Expert Review / Save Review |
| `GET /api/scans/export` | Export CSV with the history filters |
| `POST /api/fields/[id]/forecast` | Refresh Forecast, and Refresh All on the map (one call per field, so progress can be shown) |
| `POST /api/account/delete` | Delete Account |
| `PATCH /api/admin/users/[id]` | Change role / Deactivate (also bans the login) |

The spec's `/api/weather` and `/api/admin/stats` aren't needed. Open-Meteo allows browser calls without a key, and admin pages read through the admins' Row Level Security access instead.

Before launch, fill in the `TODO` values in `lib/site.ts`: model metrics, guide name, roll number, contact email and GitHub URL. They show as "—" or placeholders until then.

## Design references

| Source | Used for |
| --- | --- |
| Harvest | Type scale: Besley display serif at 70/50/30px with −0.04em tracking, a 16/1.5 grotesk body (Figtree stands in for Muoto), 17px pill buttons, 20px card radius |
| Greenhouse | Colour: evergreen #15372c / #031c17, mint #008561, pecan #f5eeeb, persimmon for amber, periwinkle for info |
| BetterHelp | Three-step "How it works", stats row, FAQ accordion |
| Healthline | Disease articles: title and deck, byline, jump list, ruled H2s, inline "Learn:" links, comparison table, Sources/History footer |
| Upwork | Disease Library search bar with suggestion chips and category cards |
| Asana | App shell and sidebar, product-shot hero composite, auth layout (SSO button + divider), closing CTA |

Chart colours were checked with a colour-blind-safety validator. Dark mode uses its own lighter steps (`components/charts/charts.tsx`).
