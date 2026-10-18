# BlightScan — Website Build Specification

Last updated: 18 Oct 2026 · Shazan Khan

## 1. Overview

BlightScan is a web app where a farmer photographs a tomato leaf, gets a Healthy / Early Blight / Late Blight diagnosis with a confidence score, and sees a 7-day spread-risk forecast for their field. "BlightScan" is a working name; rename it anywhere.

**Three parts:** a Next.js frontend (all pages and UI), a FastAPI service that runs the trained CNN and the spread model, and Supabase for login, the Postgres database and leaf-image storage.

| Layer | Technology | Hosted on |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router), TypeScript + JavaScript, Tailwind CSS, shadcn/ui, Recharts, React-Leaflet | Vercel |
| Auth, database, storage | Supabase (Auth, Postgres, Storage, Row Level Security) | Supabase cloud (free tier) |
| ML service | Python 3.11, FastAPI, TensorFlow/Keras (or PyTorch), Pillow, NumPy | Render or Hugging Face Spaces |
| Weather data | Open-Meteo API (free, no API key) | External |
| Model | Fine-tuned MobileNetV2 or EfficientNet-B0, 3 classes, exported as .keras or .h5 | Inside the ML service |

**Frontend languages:** the Next.js app mixes TypeScript and JavaScript. Set `"allowJs": true` in `tsconfig.json` so `.ts/.tsx` and `.js/.jsx` files can import each other. Use TypeScript (`.ts/.tsx`) for the Supabase clients, `lib/types.ts`, `middleware.ts` and the API routes, where typed database rows catch mistakes. Use JavaScript (`.js/.jsx`) freely for UI components, pages and charts. File names in this doc use `.tsx`/`.ts`; any of them can be `.jsx`/`.js` instead. The ML service stays in Python.

**User roles:** `farmer` (default: scans, fields, history), `expert` (can review and correct diagnoses), `admin` (manages users, sees all data and model stats).

**Core flow:** user signs in → uploads or captures a leaf photo → image saved to Supabase Storage → Next.js API route calls the FastAPI `/predict` endpoint → result saved to the `scans` table → if diseased, `/predict-spread` is called with field location and weather → risk forecast saved and shown on the result page.

### System architecture

```
Browser (Next.js on Vercel)
   │   login + photo upload ─────────────────────▶  Supabase
   │                                                 (Auth · Postgres, 7 tables + RLS · Storage)
   │   POST /api/scans                                      ▲
   ▼                                                        │  save scan + spread forecast
Next.js API routes (server only, holds secret keys) ────────┘
   │   signed image URL + X-API-Key
   ▼
FastAPI ML service  (/predict: CNN, 3 classes · /predict-spread: 7-day risk)
   │   hourly weather
   ▼
Open-Meteo API (free hourly weather forecast)
```

Only the Next.js API routes hold secret keys; they call the model service and write every result to Supabase.

## 2. Site map and routes

The site has 28 routes: 10 public (including 404), 5 for sign-in, 9 behind login and 4 admin-only. Protect routes with Next.js `middleware.ts` using the Supabase session; a logged-out user hitting a protected route is sent to `/login?redirect=<original path>`.

| Route | Page | Access | Purpose |
| --- | --- | --- | --- |
| `/` | Home | Public | Landing page: hero, how it works, features, stats, CTA |
| `/about` | About | Public | Project background, team, guide, university |
| `/diseases` | Disease Library | Public | Cards for Early Blight and Late Blight |
| `/diseases/early-blight` | Disease detail | Public | Symptoms, causes, weather triggers, treatment, prevention |
| `/diseases/late-blight` | Disease detail | Public | Same layout as above |
| `/how-it-works` | Technology | Public | Model architecture, dataset, accuracy, pipeline diagram |
| `/contact` | Contact | Public | Contact form saved to `contact_messages` |
| `/privacy`, `/terms` | Legal | Public | Privacy policy, terms of use |
| `/login` | Login | Guests only | Email/password and Google login |
| `/signup` | Sign up | Guests only | Create account |
| `/forgot-password` | Forgot password | Guests only | Send reset link |
| `/reset-password` | Reset password | Via email link | Set new password |
| `/auth/callback` | (no UI) | System | Supabase OAuth / email confirm callback |
| `/dashboard` | Dashboard | Logged in | Overview: stats, recent scans, risk alerts, weather |
| `/scan` | New Scan | Logged in | Upload or capture a leaf photo, pick field, analyse |
| `/scan/[id]` | Scan Result | Owner or expert | Diagnosis, confidence, treatment, spread forecast |
| `/history` | Scan History | Logged in | Filterable table of all past scans |
| `/fields` | My Fields | Logged in | List of the user's fields with risk level |
| `/fields/new` | Add Field | Logged in | Name, crop, map pin, area |
| `/fields/[id]` | Field detail | Owner | Map, scans in this field, spread forecast chart |
| `/spread-map` | Spread Risk Map | Logged in | Map of all the user's fields coloured by risk |
| `/profile` | Profile & Settings | Logged in | Edit profile, password, notifications, delete account |
| `/admin` | Admin overview | Admin | Platform stats and model performance |
| `/admin/users` | User management | Admin | List users, change role, deactivate |
| `/admin/scans` | All scans / review | Admin, expert | Review and correct predictions |
| `/admin/messages` | Contact messages | Admin | Read and mark contact form messages |
| `/not-found` | 404 | Public | Friendly error with "Go Home" button |

## 3. Global layout

Every page shares one navbar and one footer from `app/layout.tsx`; logged-in app pages (`/dashboard`, `/scan`, `/history`, `/fields`, `/spread-map`, `/profile`) also get a left sidebar from `app/(app)/layout.tsx`.

### Navbar (sticky, top)

| Element | Logged out | Logged in | Action / route |
| --- | --- | --- | --- |
| Logo + "BlightScan" | Shown | Shown | → `/` (logged out) or `/dashboard` (logged in) |
| Tab: Home | Shown | Hidden | → `/` |
| Tab: How It Works | Shown | Shown | → `/how-it-works` |
| Tab: Disease Library | Shown | Shown | → `/diseases` |
| Tab: About | Shown | Hidden | → `/about` |
| Tab: Contact | Shown | Hidden | → `/contact` |
| Tab: Dashboard | Hidden | Shown | → `/dashboard` |
| Button: Log in (outline) | Shown | Hidden | → `/login` |
| Button: Get Started (filled) | Shown | Hidden | → `/signup` |
| Button: + New Scan (filled) | Hidden | Shown | → `/scan` |
| Avatar dropdown | Hidden | Shown | Menu items below |
| Theme toggle (sun/moon) | Shown | Shown | Switches light/dark, saved in localStorage |

**Avatar dropdown items:** Profile → `/profile` · My Fields → `/fields` · Scan History → `/history` · Admin Panel → `/admin` (only if role = admin) · Log out → calls `supabase.auth.signOut()` then redirects to `/`.

**Active tab:** underline + accent colour using `usePathname()`. **Mobile (< 768 px):** tabs collapse into a hamburger that opens a full-height slide-in drawer with the same items stacked; tapping a link closes the drawer.

### App sidebar (logged-in pages only)

- Dashboard → `/dashboard`
- New Scan → `/scan`
- Scan History → `/history`
- My Fields → `/fields`
- Spread Risk Map → `/spread-map`
- Disease Library → `/diseases`
- Settings → `/profile`
- Admin (only for admin/expert) → `/admin`

Collapsible to icons only; on mobile it becomes a bottom tab bar with Dashboard, Scan, History, Fields, Profile.

### Footer (all pages)

Four columns on desktop, stacked on mobile, plus a bottom bar.

| Column | Links (each → route) |
| --- | --- |
| Brand | Logo, one-line tagline "Early blight detection for tomato growers", social icons (GitHub repo, LinkedIn) opening in a new tab |
| Product | New Scan → `/scan` · Dashboard → `/dashboard` · Spread Risk Map → `/spread-map` · How It Works → `/how-it-works` |
| Resources | Disease Library → `/diseases` · Early Blight → `/diseases/early-blight` · Late Blight → `/diseases/late-blight` · Dataset (PlantVillage, external link) |
| Project | About → `/about` · Contact → `/contact` · Privacy Policy → `/privacy` · Terms → `/terms` |

**Bottom bar:** "© 2026 BlightScan · B.Tech CSE (AI & ML) project, Manav Rachna University" on the left; "Back to top ↑" button on the right (smooth-scrolls to top).

### Shared UI behaviour

- **Toasts** (top-right) for success and error after every save, delete or upload.
- **Loading:** skeleton cards on data pages; spinner + "Analysing leaf…" on scan submit.
- **Empty states:** illustration + one line + a button (e.g. "No scans yet" + "Start your first scan" → `/scan`).
- **Confirm dialog** before any delete.
- **404 page:** "Page not found" + "Go Home" → `/` and "Go to Dashboard" → `/dashboard`.

## 4. Page-by-page specification

Each page lists its sections top to bottom; every button names exactly what it does or where it goes.

### 4.1 Home `/`

1. **Hero** — headline "Catch tomato blight before it spreads", subline "Snap a leaf photo. Get a diagnosis in seconds and a 7-day spread forecast for your field.", a tomato-leaf image or illustration on the right.
   - Button **Start Free Scan** → `/signup` (logged out) or `/scan` (logged in)
   - Button **See How It Works** → smooth-scroll to section 2
2. **How it works** — 3 numbered steps with icons: Capture leaf photo → AI diagnosis → Spread forecast and treatment.
3. **What we detect** — 3 cards: Healthy, Early Blight, Late Blight, each with a sample image and 1-line symptom.
   - Each card button **Learn more** → `/diseases/early-blight`, `/diseases/late-blight`, or `/diseases` for Healthy
4. **Features** — 6 tiles: Instant diagnosis, Confidence score, Treatment guidance, Spread forecast, Field mapping, Scan history.
5. **Model at a glance** — stat counters: number of training images, number of classes (3), validation accuracy (fill from your real result), average response time.
   - Button **Read the technology** → `/how-it-works`
6. **FAQ** — accordion of 5–6 questions (Is it free? Which crops? How accurate? Do I need internet? Is my data private? Can it replace an agronomist?).
7. **Final CTA band** — "Protect your tomato crop today".
   - Button **Create Free Account** → `/signup`
   - Button **Contact Us** → `/contact`

### 4.2 How It Works `/how-it-works`

1. **Intro** — one paragraph on the two-stage system.
2. **Pipeline diagram** — Image → Preprocess → CNN → Diagnosis → Weather + location → Spread model → Risk map.
3. **Dataset** — PlantVillage tomato subset, class counts, train/validation/test split, augmentation used.
4. **Model** — backbone (MobileNetV2 / EfficientNet), input size 224×224, optimiser, epochs.
5. **Results** — accuracy, precision, recall, F1 cards + confusion-matrix image + training curves image.
6. **Limitations** — lab images vs field photos, single-leaf images work best.
   - Button **Try a Scan** → `/scan`

### 4.3 Disease Library `/diseases` and detail pages

- **List page:** search bar (filters cards client-side) + 2 large cards (Early Blight, Late Blight) each with image, pathogen name, severity badge.
  - Card click / **Read more** → `/diseases/early-blight` or `/diseases/late-blight`
- **Detail page sections:** header with image gallery → Pathogen (*Alternaria solani* / *Phytophthora infestans*) → Symptoms (bulleted) → Favourable weather → How it spreads → Treatment (organic and chemical tabs) → Prevention checklist → Related disease card.
  - Button **Scan a leaf now** → `/scan`
  - Button **Back to library** → `/diseases`
- Content comes from the `diseases` table so it can be edited without a redeploy.

### 4.4 About `/about`

Sections: Project mission → Problem it solves → Team card (Shazan Khan, roll no., B.Tech CSE AI & ML) → Guide card ([Guide name], department) → University → Tech stack logos.

- Button **View on GitHub** → repo URL (new tab)
- Button **Contact the team** → `/contact`

### 4.5 Contact `/contact`

Left: form with Name, Email, Subject (dropdown: General, Bug report, Feedback, Collaboration), Message. Right: email address, university address, response-time note.

- Button **Send Message** → validates (all required, valid email, message ≥ 20 chars) → inserts into `contact_messages` → success toast "Message sent" → form resets.

### 4.6 Auth pages

- **`/login`** — Email, Password (show/hide eye icon), "Remember me" checkbox.
  - **Log in** → `supabase.auth.signInWithPassword()` → redirect to `?redirect` value or `/dashboard`; error toast on failure
  - **Continue with Google** → `signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })`
  - Link **Forgot password?** → `/forgot-password`
  - Link **Create an account** → `/signup`
- **`/signup`** — Full name, Email, Password, Confirm password, Role is fixed to farmer, "I agree to the Terms" checkbox (links to `/terms`).
  - **Create Account** → `supabase.auth.signUp()` with `full_name` in metadata → screen "Check your email to confirm"
  - **Continue with Google** → same as login
  - Link **Already have an account? Log in** → `/login`
- **`/forgot-password`** — Email field.
  - **Send Reset Link** → `resetPasswordForEmail(email, { redirectTo: '/reset-password' })` → "Check your inbox" message
  - Link **Back to login** → `/login`
- **`/reset-password`** — New password + confirm.
  - **Update Password** → `supabase.auth.updateUser({ password })` → toast → `/login`
- **`/auth/callback`** — route handler that exchanges the code for a session, then redirects to `/dashboard`.

### 4.7 Dashboard `/dashboard`

1. **Greeting bar** — "Good evening, {first name}" + today's date + location.
   - Button **+ New Scan** → `/scan`
2. **Stat cards (4)** — Total scans · Diseased detected · Fields monitored · High-risk fields. Each card is clickable → `/history`, `/history?result=diseased`, `/fields`, `/fields?risk=high`.
3. **Risk alerts** — red/amber banners for any field with risk = high in the last 7 days. Each has **View field** → `/fields/[id]`; dismiss X hides it for the session.
4. **Weather widget** — current temperature, humidity, rainfall for the user's default field (Open-Meteo), with a blight-favourable badge when conditions match.
5. **Recent scans** — last 5 as thumbnail rows: image, result badge, confidence, date. Row click → `/scan/[id]`; **View all** → `/history`.
6. **Charts** — Scans per week (bar) and Result breakdown Healthy / Early / Late (donut), from `scans`.
7. **Empty state** (no scans) — "Run your first scan" + **Start Scanning** → `/scan`.

### 4.8 New Scan `/scan`

1. **Step 1 – Choose field** — dropdown of the user's fields; option "No field" allowed.
   - Link **+ Add a field** → `/fields/new?return=/scan`
2. **Step 2 – Add photo** — two tabs:
   - **Upload** — drag-and-drop zone + **Browse files** button; JPG/PNG/WEBP, max 5 MB.
   - **Camera** — opens the phone or laptop camera via `<input type="file" accept="image/*" capture="environment">` (works on mobile browsers); **Capture** takes the photo.
3. **Preview** — image preview with **Retake / Remove** (clears) and an optional notes textbox.
4. **Photo tips** — single leaf, good light, plain background, fill the frame.
5. **Analyse Leaf** button (disabled until a photo exists). On click:
   1. Compress image client-side to max 1024 px.
   2. Upload to Supabase Storage bucket `leaf-images` at `{user_id}/{uuid}.jpg`.
   3. `POST /api/scans` with `{ image_path, field_id, notes }`.
   4. Server calls FastAPI `/predict`, saves the row, triggers spread prediction if diseased.
   5. Redirect to `/scan/[id]`. Show a full-screen loader "Analysing leaf…" meanwhile; on error, toast + stay on page.

### 4.9 Scan Result `/scan/[id]`

1. **Diagnosis card** — leaf image left; right: big result label (green Healthy, amber Early Blight, red Late Blight), confidence % bar, severity (Low / Moderate / High), scan date, field name.
2. **Probability breakdown** — horizontal bars for all 3 classes.
3. **Low-confidence warning** — if top confidence < 60%: "We're not sure. Retake the photo in better light or ask an expert."
4. **What this means** — short description of the disease from the `diseases` table.
5. **Recommended actions** — treatment and prevention checklist (tabs: Organic / Chemical).
6. **Spread forecast** (only if diseased and field has a location) — risk badge, 7-day line chart of risk score, weather summary, short text "High risk of spread in the next 3 days due to humidity above 90%".
7. **Expert review** — if an expert corrected it, show "Reviewed by expert: {label}" with their note.
8. **Action buttons:**
   - **Scan Another Leaf** → `/scan`
   - **View Field** → `/fields/[field_id]`
   - **Download Report (PDF)** → generates a PDF client-side (react-pdf / jsPDF) with image, result and treatment
   - **Share** → copies the page link
   - **Request Expert Review** → sets `review_status = 'requested'`, toast
   - **Delete Scan** → confirm dialog → deletes row + image → redirect to `/history`
   - **Back to History** → `/history`

### 4.10 Scan History `/history`

- **Filter bar:** search by notes, Result (All / Healthy / Early Blight / Late Blight), Field, Date range, Sort (Newest / Oldest / Confidence). Filters live in the URL query string so they survive refresh.
- **View toggle:** Table / Grid.
- **Table columns:** Thumbnail · Result badge · Confidence · Field · Date · Actions (**View** → `/scan/[id]`, **Delete** → confirm).
- **Bulk select** with **Delete selected** and **Export CSV** (downloads filtered rows).
- **Pagination:** 10 per page, Prev / Next.
- **Empty state:** **Start your first scan** → `/scan`.

### 4.11 My Fields `/fields`, `/fields/new`, `/fields/[id]`

- **List page:** grid of field cards: name, crop (Tomato), area, risk badge, last scan date, scan count.
  - **+ Add Field** → `/fields/new`
  - Card click → `/fields/[id]`; card menu **Edit** → `/fields/[id]?edit=1`, **Delete** → confirm
- **Add Field page:** Field name, Crop (Tomato, fixed), Variety (optional), Area (acres), Planting date, Location picker (Leaflet map: click to drop pin, or **Use my location** → browser geolocation).
  - **Save Field** → insert into `fields` → back to `?return` or `/fields`
  - **Cancel** → `/fields`
- **Field detail page:** header (name, area, risk badge) → map with pin → 7-day spread forecast chart → weather panel → this field's scans list.
  - **Scan in this field** → `/scan?field=[id]`
  - **Refresh Forecast** → `POST /api/fields/[id]/forecast`
  - **Edit** / **Delete**

### 4.12 Spread Risk Map `/spread-map`

- Full-width Leaflet map with every field as a coloured circle (green low, amber medium, red high); circle radius grows with risk score.
- Legend bottom-left; side panel with filter Risk level and a list of fields.
- Marker click → popup: field name, risk, last diagnosis, **Open field** → `/fields/[id]`.
- **Refresh all forecasts** → recalculates every field.

### 4.13 Profile & Settings `/profile`

Tabs:

- **Profile:** avatar upload (bucket `avatars`), full name, phone, state/district, preferred language. **Save Changes** → update `profiles`.
- **Account:** email (read-only), **Change Password** (current + new) → `updateUser`.
- **Notifications:** toggles: email me on high-risk alert, weekly summary. **Save**.
- **Danger zone:** **Delete Account** → type "DELETE" to confirm → calls `/api/account/delete` (removes data + auth user) → `/`.

### 4.14 Admin panel `/admin/*` (role admin; expert sees only Review)

- **`/admin` overview:** cards (total users, total scans, scans today, % diseased), chart of scans per day, model card (version, accuracy, avg confidence), table of recent low-confidence scans.
- **`/admin/users`:** searchable table: name, email, role, scans, joined date. Row actions: **Change role** (dropdown farmer / expert / admin), **Deactivate**.
- **`/admin/scans`:** all scans with filter "Needs review" (requested or confidence < 60%). Row → review drawer: image, model result, select **Correct label**, notes, **Save Review** → sets `expert_label`, `review_status = 'reviewed'`, `reviewed_by`.
- **`/admin/messages`:** contact messages table, **Mark as read**, **Reply** (opens mailto:), **Delete**.

## 5. Supabase: database, security, storage, auth

Seven tables hold everything; Row Level Security (RLS) makes each user see only their own rows, while experts and admins get wider access through their role in `profiles`.

| Table | Holds | Key columns |
| --- | --- | --- |
| `profiles` | One row per user (extends `auth.users`) | id, full_name, role, phone, state, district, avatar_url, notify_email |
| `fields` | A user's tomato plots | id, user_id, name, variety, area_acres, planting_date, latitude, longitude, current_risk |
| `scans` | Every leaf diagnosis | id, user_id, field_id, image_path, predicted_label, confidence, probabilities, severity, review_status, expert_label |
| `spread_predictions` | 7-day risk forecast per field | id, field_id, scan_id, risk_level, risk_score, forecast (jsonb), summary, weather (jsonb) |
| `diseases` | Library content | slug, name, pathogen, symptoms, treatment, prevention, images |
| `contact_messages` | Contact form | name, email, subject, message, is_read |
| `model_versions` | Which model produced a result | version, architecture, accuracy, is_active |

### 5.1 SQL — run in Supabase SQL Editor

```sql
-- Enums
create type user_role as enum ('farmer','expert','admin');
create type disease_label as enum ('healthy','early_blight','late_blight');
create type risk_level as enum ('low','medium','high');
create type review_status as enum ('none','requested','reviewed');

-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'farmer',
  phone text,
  state text,
  district text,
  avatar_url text,
  notify_email boolean default true,
  created_at timestamptz default now()
);

-- Fields
create table fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  crop text not null default 'tomato',
  variety text,
  area_acres numeric(8,2),
  planting_date date,
  latitude double precision,
  longitude double precision,
  current_risk risk_level default 'low',
  created_at timestamptz default now()
);

-- Model versions
create table model_versions (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,
  architecture text,
  accuracy numeric(5,2),
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Scans
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  field_id uuid references fields(id) on delete set null,
  image_path text not null,
  predicted_label disease_label not null,
  confidence numeric(5,2) not null,
  probabilities jsonb not null,   -- {"healthy":0.03,"early_blight":0.91,"late_blight":0.06}
  severity text,                  -- low | moderate | high
  notes text,
  model_version text references model_versions(version),
  review_status review_status default 'none',
  expert_label disease_label,
  expert_note text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
create index on scans (user_id, created_at desc);
create index on scans (field_id);

-- Spread predictions
create table spread_predictions (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references fields(id) on delete cascade,
  scan_id uuid references scans(id) on delete set null,
  disease disease_label not null,
  risk_level risk_level not null,
  risk_score numeric(5,2) not null,  -- 0 to 100
  forecast jsonb not null,           -- [{"date":"2026-10-19","score":64}, ...]
  summary text,                      -- one-line explanation of the worst day
  weather jsonb,                     -- raw daily temp / humidity / rain used
  created_at timestamptz default now()
);
create index on spread_predictions (field_id, created_at desc);

-- Disease library
create table diseases (
  slug text primary key,             -- 'early-blight', 'late-blight'
  name text not null,
  pathogen text,
  summary text,
  symptoms text[],
  favourable_conditions text,
  spread_mode text,
  treatment_organic text[],
  treatment_chemical text[],
  prevention text[],
  image_urls text[]
);

-- Contact messages
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Auto-create a profile when a user signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper: current user's role
create function public.my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;
```

### 5.2 Row Level Security

```sql
alter table profiles enable row level security;
alter table fields enable row level security;
alter table scans enable row level security;
alter table spread_predictions enable row level security;
alter table diseases enable row level security;
alter table contact_messages enable row level security;
alter table model_versions enable row level security;

-- profiles
create policy "own profile read" on profiles for select using (id = auth.uid() or my_role() = 'admin');
create policy "own profile update" on profiles for update using (id = auth.uid());
create policy "admin updates any profile" on profiles for update using (my_role() = 'admin');

-- fields: owner only
create policy "fields owner all" on fields for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- scans: owner full access; expert/admin read + review
create policy "scans owner all" on scans for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "scans staff read" on scans for select using (my_role() in ('expert','admin'));
create policy "scans staff review" on scans for update using (my_role() in ('expert','admin'));

-- spread predictions: visible if you own the field
create policy "spread owner read" on spread_predictions for select
  using (exists (select 1 from fields f where f.id = field_id and f.user_id = auth.uid()));

-- diseases + model_versions: public read, admin write
create policy "diseases public read" on diseases for select using (true);
create policy "diseases admin write" on diseases for all using (my_role() = 'admin');
create policy "models public read" on model_versions for select using (true);

-- contact: anyone can insert, only admin reads
create policy "contact insert" on contact_messages for insert with check (true);
create policy "contact admin" on contact_messages for all using (my_role() = 'admin');
```

Inserts into `spread_predictions` and `model_versions` are done by the server with the **service role key**, which bypasses RLS. Never expose that key in the browser.

### 5.3 Storage buckets

| Bucket | Public? | Path pattern | Policy |
| --- | --- | --- | --- |
| `leaf-images` | Private | `{user_id}/{scan_uuid}.jpg` | Users read/write only inside their own `{user_id}/` folder; experts/admins read all; served with signed URLs (1 hour) |
| `avatars` | Public | `{user_id}/avatar.jpg` | Anyone reads; users write only their own folder |
| `disease-images` | Public | `early-blight/1.jpg` | Anyone reads; admin writes |

```sql
create policy "leaf own upload" on storage.objects for insert
  with check (bucket_id = 'leaf-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "leaf own read" on storage.objects for select
  using (bucket_id = 'leaf-images' and ((storage.foldername(name))[1] = auth.uid()::text or my_role() in ('expert','admin')));
create policy "leaf own delete" on storage.objects for delete
  using (bucket_id = 'leaf-images' and (storage.foldername(name))[1] = auth.uid()::text);
```

### 5.4 Auth settings (Supabase dashboard → Authentication)

- Providers: **Email** (confirm email ON) and **Google** (add Google Cloud OAuth client ID and secret).
- Site URL: your Vercel URL. Redirect URLs: `http://localhost:3000/auth/callback`, `https://<your-app>.vercel.app/auth/callback`, and the same for `/reset-password`.
- Make yourself admin after first signup: `update profiles set role = 'admin' where id = '<your user id>';`
- Use `@supabase/ssr` in Next.js: a browser client for client components and a server client (cookies) for server components, route handlers and middleware.

## 6. Backend

The browser never calls the ML service directly: it calls Next.js API routes, which check the Supabase session, call FastAPI with a secret API key, and write results to Supabase with the service role key.

### 6.1 FastAPI ML service endpoints

Every request except `/health` must carry header `X-API-Key: <ML_API_KEY>`; otherwise return 401.

| Method | Endpoint | Request | Response |
| --- | --- | --- | --- |
| GET | `/health` | none | `{ "status": "ok", "model_version": "v1.0" }` |
| POST | `/predict` | `{ "image_url": "<signed URL>" }` or multipart `file` | `{ "label": "early_blight", "confidence": 91.4, "probabilities": {...}, "severity": "moderate", "model_version": "v1.0", "inference_ms": 210 }` |
| POST | `/predict-spread` | `{ "disease": "late_blight", "latitude": 28.4, "longitude": 77.3, "severity": "high", "recent_cases": 3 }` | `{ "risk_level": "high", "risk_score": 78, "forecast": [{"date": "…", "score": 64}, …], "weather": {...}, "summary": "…" }` |

```python
# ml-service/app/main.py
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import numpy as np, requests, io, os, time
from PIL import Image
import tensorflow as tf

CLASSES = ["early_blight", "healthy", "late_blight"]  # MUST match training folder order
MODEL = tf.keras.models.load_model("model/tomato_blight_v1.keras")
API_KEY = os.environ["ML_API_KEY"]
app = FastAPI()

class PredictIn(BaseModel):
    image_url: str

def check(key):
    if key != API_KEY:
        raise HTTPException(401, "Invalid API key")

@app.get("/health")
def health():
    return {"status": "ok", "model_version": "v1.0"}

@app.post("/predict")
def predict(body: PredictIn, x_api_key: str = Header(None)):
    check(x_api_key)
    t0 = time.time()
    img = Image.open(io.BytesIO(requests.get(body.image_url, timeout=15).content)).convert("RGB")
    x = np.expand_dims(np.array(img.resize((224, 224)), dtype=np.float32), 0)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)  # same preprocessing as training
    p = MODEL.predict(x, verbose=0)[0]
    i = int(np.argmax(p))
    conf = float(p[i]) * 100
    severity = "low" if CLASSES[i] == "healthy" else ("high" if conf > 85 else "moderate")
    return {
        "label": CLASSES[i],
        "confidence": round(conf, 2),
        "probabilities": {c: round(float(v), 4) for c, v in zip(CLASSES, p)},
        "severity": severity,
        "model_version": "v1.0",
        "inference_ms": int((time.time() - t0) * 1000),
    }
```

The severity rule above is a placeholder based on confidence; replace it with a lesion-area estimate if you add segmentation later. Add `CORSMiddleware` only for your Vercel domain.

### 6.2 Next.js API routes (`app/api/.../route.ts`)

| Method | Route | Called by | What it does |
| --- | --- | --- | --- |
| POST | `/api/scans` | Analyse Leaf button | Check session → create signed URL for `image_path` → call FastAPI `/predict` → insert into `scans` → if diseased and field has location, call `/predict-spread`, insert into `spread_predictions`, update `fields.current_risk` → return `{ id }` |
| DELETE | `/api/scans/[id]` | Delete Scan | Check ownership → delete storage object → delete row |
| PATCH | `/api/scans/[id]/review` | Request review / Save Review | Farmer: set `review_status='requested'`. Expert/admin: set `expert_label`, `expert_note`, `reviewed_by`, `reviewed_at`, `review_status='reviewed'` |
| GET | `/api/scans/export` | Export CSV | Returns the user's filtered scans as CSV |
| POST | `/api/fields/[id]/forecast` | Refresh Forecast | Uses the field's latest diseased scan → `/predict-spread` → insert + update risk |
| POST | `/api/forecast/refresh-all` | Refresh all forecasts | Loops over the user's fields with a location |
| GET | `/api/weather?lat=&lon=` | Dashboard widget | Proxies Open-Meteo, caches 30 min |
| POST | `/api/account/delete` | Delete Account | Deletes storage folder + `auth.admin.deleteUser()` (service role) |
| GET | `/api/admin/stats` | Admin overview | Counts and charts data; checks role = admin |
| PATCH | `/api/admin/users/[id]` | Change role / Deactivate | Admin only |

Simple reads (history list, fields list, disease pages, dashboard cards) query Supabase directly from server components; RLS keeps them safe. Contact form inserts directly into `contact_messages` from the client.

```ts
// app/api/scans/route.ts (core of the flow)
export async function POST(req: Request) {
  const supabase = createServerClient();            // @supabase/ssr, reads cookies
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { image_path, field_id, notes } = await req.json();
  if (!image_path.startsWith(`${user.id}/`)) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { data: signed } = await supabase.storage.from('leaf-images').createSignedUrl(image_path, 300);
  const ml = await fetch(`${process.env.ML_API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.ML_API_KEY! },
    body: JSON.stringify({ image_url: signed!.signedUrl }),
  });
  if (!ml.ok) return Response.json({ error: 'Model service unavailable' }, { status: 502 });
  const r = await ml.json();

  const { data: scan, error } = await supabase.from('scans').insert({
    user_id: user.id, field_id, notes, image_path,
    predicted_label: r.label, confidence: r.confidence,
    probabilities: r.probabilities, severity: r.severity, model_version: r.model_version,
  }).select('id').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (r.label !== 'healthy' && field_id) await runSpreadForecast(field_id, scan.id, r); // uses service role client
  return Response.json({ id: scan.id });
}
```

### 6.3 Error handling

| Case | User sees |
| --- | --- |
| File > 5 MB or wrong type | Inline error under the upload zone; Analyse stays disabled |
| ML service down / timeout (> 30 s) | Toast "Our model is waking up, try again in a minute" (free hosting sleeps) |
| Confidence < 60% | Result page low-confidence warning (section 4.9) |
| Not logged in | Redirect to `/login?redirect=...` |
| Accessing someone else's scan | 404 page (RLS returns no row) |

## 7. Spread prediction logic

Version 1 is a weather-driven risk score you can build and explain without historical outbreak data; a trained time-series model is the upgrade path once enough scans with dates and locations exist.

### 7.1 Inputs

- **From the scan:** disease (early or late blight), severity, confidence.
- **From the field:** latitude, longitude, area.
- **Infection pressure:** number of diseased scans in this field in the last 14 days.
- **Weather (next 7 days, hourly):** Open-Meteo forecast API with `temperature_2m`, `relative_humidity_2m`, `precipitation`, no API key needed.

### 7.2 Daily score (0–100)

For each of the 7 forecast days:

1. **Weather favourability (0–60).** Count hours that match the disease's favourable band:
   - **Late blight:** cool and wet: hours with temperature roughly 10–25 °C and humidity ≥ 90%, plus rain. This mirrors the published Hutton-criteria idea (consecutive days with mild minimum temperature and long high-humidity spells).
   - **Early blight:** warm and wet: hours with temperature roughly 24–29 °C and humidity ≥ 90% or leaf wetness from rain.
   - Score = (favourable hours ÷ 24) × 60, capped at 60.
2. **Infection pressure (0–40).** Severity (low 5, moderate 12, high 20) + recent diseased scans (5 each, max 20).
3. **Day score** = favourability + pressure. Late blight days get a ×1.2 multiplier (it spreads faster), capped at 100.
4. **Cumulative trend:** each day's final score = 0.6 × today + 0.4 × previous day, so risk builds over consecutive favourable days.

| Max 7-day score | Risk level | Badge | Message |
| --- | --- | --- | --- |
| 0–34 | Low | Green | "Conditions unfavourable for spread. Keep monitoring." |
| 35–64 | Medium | Amber | "Spread possible. Inspect nearby plants within 3 days." |
| 65–100 | High | Red | "High risk of spread. Remove infected leaves and treat now." |

The temperature bands, weights and thresholds are starting values; state them as tunable assumptions in your report and adjust them after testing.

### 7.3 Output saved

`spread_predictions` row with `risk_level`, `risk_score` (the 7-day max), `forecast` = 7 `{date, score}` points (drawn as the line chart), `weather` = daily summaries, and a one-line `summary` naming the worst day and its main driver (e.g. "Thu: 20 h above 90% humidity"). `fields.current_risk` is updated to the new level.

### 7.4 Upgrade path (v2)

Once you have dated scans across many fields, train an LSTM or gradient-boosted model on sequences of (weather, prior scores, scan outcomes) to predict the next week's diseased-scan rate, and swap it in behind the same `/predict-spread` endpoint without changing the frontend.

## 8. Project setup, deployment and build order

### 8.1 Folder structure

```
blightscan/
├── web/                          # Next.js app (deploy to Vercel)
│   ├── app/
│   │   ├── layout.tsx            # Navbar + Footer + Toaster + ThemeProvider
│   │   ├── page.tsx              # Home
│   │   ├── about/  contact/  how-it-works/  privacy/  terms/
│   │   ├── diseases/page.tsx  diseases/[slug]/page.tsx
│   │   ├── (auth)/login/  signup/  forgot-password/  reset-password/
│   │   ├── auth/callback/route.ts
│   │   ├── (app)/layout.tsx      # Sidebar for logged-in pages
│   │   ├── (app)/dashboard/  scan/  scan/[id]/  history/
│   │   ├── (app)/fields/  fields/new/  fields/[id]/  spread-map/  profile/
│   │   ├── admin/layout.tsx      # Role check: admin / expert
│   │   ├── admin/page.tsx  users/  scans/  messages/
│   │   ├── api/...               # Routes from section 6.2
│   │   └── not-found.tsx
│   ├── components/  ui/ (shadcn)  layout/ (Navbar, Footer, Sidebar)  scan/  charts/  map/
│   ├── lib/supabase/ client.ts  server.ts  admin.ts (service role)
│   ├── lib/types.ts              # generated: supabase gen types typescript
│   ├── tsconfig.json             # "allowJs": true
│   └── middleware.ts             # Session refresh + route protection
├── ml-service/                   # FastAPI (deploy to Render or HF Spaces)
│   ├── app/main.py  app/spread.py  app/weather.py
│   ├── model/tomato_blight_v1.keras
│   ├── requirements.txt  Dockerfile
├── training/                     # Colab / Jupyter notebooks
│   ├── 01_prepare_dataset.ipynb  02_train_model.ipynb  03_evaluate.ipynb
└── supabase/migrations/          # SQL from section 5
```

### 8.2 Environment variables

| Variable | Where | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | web | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | anon public key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | web (server only) | service_role key — never prefix with `NEXT_PUBLIC_` |
| `ML_API_URL` | web | e.g. `https://blightscan-ml.onrender.com` |
| `ML_API_KEY` | web + ml-service | Any long random string, same in both |
| `NEXT_PUBLIC_SITE_URL` | web | `http://localhost:3000` locally, Vercel URL in production |
| `ALLOWED_ORIGIN` | ml-service | Your Vercel URL for CORS |

### 8.3 Deployment

- **Supabase:** create project → run SQL from 5.1–5.3 → create the 3 buckets → enable Email + Google auth → seed `diseases` with 2 rows and `model_versions` with v1.0 (`is_active = true`).
- **ML service:** push `ml-service/` to GitHub → Render "New Web Service" (Docker) or a Hugging Face Space (Docker SDK) → set env vars → check `/health`. Free tiers sleep after inactivity, so the first request can take 30–60 s; hit `/health` before a demo.
- **Frontend:** import `web/` into Vercel → set env vars → deploy → add the Vercel URL to Supabase redirect URLs.

### 8.4 Build order

1. Train and evaluate the model in Colab; save `tomato_blight_v1.keras`, note the class order and accuracy.
2. Build `ml-service` with `/health` and `/predict`; test with a few leaf images locally.
3. Create the Supabase project and run all SQL.
4. Scaffold Next.js with Tailwind + shadcn/ui; add Supabase clients and `middleware.ts`.
5. Build global layout: Navbar, Footer, Sidebar, 404.
6. Build auth pages and test signup → email confirm → login → logout.
7. Build `/scan` + `POST /api/scans` + `/scan/[id]` — the core demo flow.
8. Build `/history` and `/dashboard`.
9. Build fields (`/fields`, `/fields/new`, `/fields/[id]`) with Leaflet.
10. Add `/predict-spread` + Open-Meteo + forecast chart + `/spread-map`.
11. Build public pages: Home, How It Works, Disease Library, About, Contact, legal.
12. Build admin panel and expert review.
13. Polish: loading skeletons, empty states, toasts, dark mode, mobile layout, PDF report.
14. Deploy all three parts; run an end-to-end test from a phone on mobile data.

### 8.5 Testing checklist

- [ ] Signup, email confirm, Google login, password reset all work
- [ ] Logged-out user is redirected from every protected route
- [ ] User A cannot open User B's `/scan/[id]` (shows 404)
- [ ] Upload from phone camera works on Android Chrome and iOS Safari
- [ ] Healthy, Early Blight and Late Blight test images each return the correct label
- [ ] Low-confidence warning shows for a non-leaf image
- [ ] Spread forecast appears for a diseased scan in a field with a location
- [ ] Delete scan removes both the row and the image
- [ ] Admin can change a role; farmer cannot open `/admin`
- [ ] Every navbar tab, footer link and button in section 4 goes to the right route
