content = r"""# BlightScan — Line-Drawing Wireframes for Every Page

These are low-fidelity wireframes drawn with lines. They show page structure, text placement, controls, and important click destinations. They are not final visual designs.

Legend:
- `[Button]` = clickable button
- `[Link]` = navigates to another route
- `[Input: ...]` = form field
- `(...)` = dynamic data from the database/API
- `*` = responsive/mobile version stacks the sections vertically

---

## Shared public navbar

```text
+----------------------------------------------------------------------------------+
| [BlightScan leaf] BlightScan | Home | How It Works | Disease Library | About     |
|                                                      Contact | [Log in] [Get Started] |
+----------------------------------------------------------------------------------+
```

Logo -> `/` or `/dashboard` if logged in. Home -> `/`. How It Works -> `/how-it-works`. Disease Library -> `/diseases`. About -> `/about`. Contact -> `/contact`. Log in -> `/login`. Get Started -> `/signup` or `/dashboard` if already authenticated.

## Shared public footer

```text
+----------------------------------------------------------------------------------+
| BlightScan               PRODUCT              RESOURCES            PROJECT       |
| Early blight monitoring  New Scan             Disease Library      About         |
| for tomato growers      Dashboard             Early Blight         Contact       |
| [GitHub] [LinkedIn]     Spread Risk Map       Late Blight          Privacy       |
|                          How It Works          Dataset              Terms         |
+----------------------------------------------------------------------------------+
| © 2026 BlightScan · B.Tech CSE (AI & ML) project, Manav Rachna University [↑ Top] |
+----------------------------------------------------------------------------------+
```

Only use configured external URLs. Back to top scrolls to page top.

---

# 1. Home `/`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| AI-ASSISTED TOMATO CROP MONITORING                                                 |
| Catch tomato blight             +---------------------------------------------+  |
| before it spreads.               |                                             |  |
|                                   |        TOMATO LEAF / FARM IMAGE             |  |
| Photograph a leaf. Understand     |                                             |  |
| its condition. Review a 7-day     +---------------------------------------------+  |
| weather-based risk estimate.                                                     |
| [Start Free Scan] [See How It Works]                                              |
+----------------------------------------------------------------------------------+
| HOW IT WORKS                                                                       |
| From leaf photo to clearer next steps                                              |
| +------------------+ +------------------+ +------------------+                    |
| | 1. Photograph    | | 2. Get an AI     | | 3. Plan next     |                    |
| |    a leaf        | |    prediction    | |    steps         |                    |
| +------------------+ +------------------+ +------------------+                    |
+----------------------------------------------------------------------------------+
| WHAT WE DETECT                                                                     |
| +------------------+ +------------------+ +------------------+                    |
| | Healthy          | | Early Blight     | | Late Blight      |                    |
| | Short description| | Short description| | Short description|                    |
| | [Learn more]     | | [Learn more]     | | [Learn more]     |                    |
| +------------------+ +------------------+ +------------------+                    |
+----------------------------------------------------------------------------------+
| FEATURES: AI classification | Confidence | Treatment | Forecast | Fields | History|
+----------------------------------------------------------------------------------+
| MODEL AT A GLANCE: [Class count] [Measured accuracy] [Inference time]             |
| [Read the technology]                                                             |
+----------------------------------------------------------------------------------+
| FAQ: [Question +] [Question +] [Question +] [Question +]                          |
+----------------------------------------------------------------------------------+
| Give your tomato crop a closer look. [Create Free Account] [Contact Us]            |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Clicks: Start Free Scan -> `/scan` if authenticated, otherwise `/signup`; See How It Works -> scroll to section; disease cards -> `/diseases` or disease detail routes; technology -> `/how-it-works`; Create Free Account -> `/signup`; Contact Us -> `/contact`.

---

# 2. About `/about`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| ABOUT THE PROJECT                                                                 |
| Making tomato leaf monitoring easier to understand.                               |
| BlightScan explores image classification and weather information for crop         |
| monitoring.                                                                        |
+----------------------------------------------------------------------------------+
| THE PROBLEM                                                                        |
| [Text about disease identification and weather-related risk]                       |
+----------------------------------------------------------------------------------+
| OUR APPROACH                                                                       |
| +-----------------------------+ +-----------------------------+                    |
| | Leaf classification         | | Spread-risk estimation      |                    |
| | What the CNN predicts       | | Weather + located field     |                    |
| +-----------------------------+ +-----------------------------+                    |
+----------------------------------------------------------------------------------+
| THE TEAM                                                                           |
| +---------------------------+ +---------------------------+                        |
| | [Photo/avatar]            | | [Guide photo/avatar]      |                        |
| | Shazan Khan               | | [Add guide name]          |                        |
| | B.Tech CSE (AI & ML)      | | [Add department]          |                        |
| +---------------------------+ +---------------------------+                        |
+----------------------------------------------------------------------------------+
| TECHNOLOGY: Next.js | Supabase | FastAPI | CNN | Open-Meteo                       |
| [View on GitHub] [Contact the team]                                                |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Clicks: GitHub -> configured repository; Contact -> `/contact`.

---

# 3. Disease Library `/diseases`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| TOMATO DISEASE GUIDE                                                               |
| Know what to look for.                                                            |
| Explore supported blight classes and compare common symptoms.                     |
| [Search diseases or symptoms........................................] [Clear]     |
+----------------------------------------------------------------------------------+
| +----------------------------------+ +-----------------------------------------+ |
| | [Early Blight image]             | | [Late Blight image]                     | |
| | Early Blight                     | | Late Blight                              | |
| | Pathogen: Alternaria solani       | | Pathogen: Phytophthora infestans        | |
| | Short symptom description        | | Short symptom description               | |
| | [Read Early Blight Guide]        | | [Read Late Blight Guide]                | |
| +----------------------------------+ +-----------------------------------------+ |
+----------------------------------------------------------------------------------+
| Not sure what the leaf shows? [Scan a Leaf]                                       |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Search filters cards. Early Blight -> `/diseases/early-blight`; Late Blight -> `/diseases/late-blight`; Scan -> `/scan` or `/signup`.

---

# 4. Early Blight `/diseases/early-blight`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| Disease Library / Early Blight                                                    |
| EARLY BLIGHT                         +-----------------------------------------+ |
| Associated pathogen:                 | [Large leaf symptom image]              | |
| Alternaria solani                    +-----------------------------------------+ |
| Introductory disease description                                                  |
+----------------------------------------------------------------------------------+
| WHAT TO LOOK FOR                                                                  |
| [Symptom bullet] [Symptom bullet] [Symptom bullet]                                |
+----------------------------------------------------------------------------------+
| CONDITIONS THAT CAN FAVOR DISEASE                                                 |
| [Warmth] [Humidity] [Leaf wetness] — explanatory text                             |
+----------------------------------------------------------------------------------+
| HOW IT CAN SPREAD                                                                 |
| [Short explanatory paragraph]                                                     |
+----------------------------------------------------------------------------------+
| MANAGEMENT OPTIONS                                                                |
| [Organic & Cultural Practices] [Chemical Options]                                 |
| [Treatment guidance for selected tab]                                            |
+----------------------------------------------------------------------------------+
| PREVENTION CHECKLIST                                                              |
| [ ] Inspect plants [ ] Maintain airflow [ ] Clean tools [ ] Monitor plants        |
+----------------------------------------------------------------------------------+
| COMPARE WITH LATE BLIGHT                                                          |
| [Read Late Blight Guide] [Scan a Leaf Now] [Back to Disease Library]              |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Tabs switch content. Related disease -> `/diseases/late-blight`; scan -> `/scan` or `/signup`; library -> `/diseases`.

---

# 5. Late Blight `/diseases/late-blight`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| Disease Library / Late Blight                                                     |
| LATE BLIGHT                          +-----------------------------------------+ |
| Associated pathogen:                  | [Large leaf symptom image]             | |
| Phytophthora infestans                 +-----------------------------------------+ |
| Intro: symptoms can progress rapidly under favorable conditions.                  |
+----------------------------------------------------------------------------------+
| WHAT TO LOOK FOR: water-soaked/dark lesions, rapid changes, affected tissue       |
+----------------------------------------------------------------------------------+
| FAVORABLE WEATHER: wetness, humidity, suitable temperatures                       |
+----------------------------------------------------------------------------------+
| HOW IT CAN SPREAD: infected plant material and spores under suitable conditions   |
+----------------------------------------------------------------------------------+
| MANAGEMENT OPTIONS                                                                |
| [Organic & Cultural Practices] [Chemical Options]                                 |
| [Selected treatment guidance]                                                     |
+----------------------------------------------------------------------------------+
| PREVENTION CHECKLIST: [ ] Inspect plants [ ] Monitor advisories [ ] Sanitation    |
+----------------------------------------------------------------------------------+
| [Read Early Blight Guide] [Scan a Leaf Now] [Back to Disease Library]             |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Same interactions as Early Blight, but related disease -> `/diseases/early-blight`.

---

# 6. How It Works `/how-it-works`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| THE TECHNOLOGY                                                                     |
| From a leaf image to a field-level risk estimate.                                 |
| Short explanation of classification and weather-driven forecasting.               |
+----------------------------------------------------------------------------------+
| PIPELINE                                                                           |
| +-------------+   +-------------+   +-------------+   +----------------------+   |
| | Upload leaf |-->| Preprocess  |-->| CNN predict |-->| Save prediction      |   |
| +-------------+   +-------------+   +-------------+   +----------------------+   |
|                                                               |                  |
| +----------------------+  +----------------+  +-------------------------------+ |
| | 7-day risk estimate  |< | Weather data   |< | Field coordinates + scan      | |
| +----------------------+  +----------------+  +-------------------------------+ |
+----------------------------------------------------------------------------------+
| DATASET: source, confirmed class counts, split methodology                        |
+----------------------------------------------------------------------------------+
| MODEL: architecture, input size, classes, version                                 |
+----------------------------------------------------------------------------------+
| PERFORMANCE: [Accuracy] [Precision] [Recall] [F1] [Confusion matrix]              |
| Show real measured values only.                                                   |
+----------------------------------------------------------------------------------+
| LIMITATIONS: image quality, domain shift, forecast uncertainty                    |
| [Try a Scan]                                                                      |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Try a Scan -> `/scan` or `/signup`. Charts/images may open larger views.

---

# 7. Contact `/contact`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| GET IN TOUCH                                                                       |
| Contact the BlightScan team.                                                      |
| Have a question, found an issue, or want to discuss the project?                   |
+--------------------------------------+-------------------------------------------+
| CONTACT FORM                         | PROJECT DETAILS                           |
| [Name............................]   | Configured email                          |
| [Email...........................]   | University/project details                |
| [Subject v.......................]   | Response-time information                 |
| [Message........................]    |                                           |
| [................................]   |                                           |
| [Send Message]                      |                                           |
+--------------------------------------+-------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Send Message validates name, email, subject, and a 20-character minimum message; submits to `contact_messages`; shows success only after database confirmation.

---

# 8. Privacy Policy `/privacy`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| PRIVACY POLICY                                                                     |
| Last updated: [configured date]                                                   |
+--------------------------+-------------------------------------------------------+
| ON THIS PAGE             | POLICY CONTENT                                        |
| • Information collected  | 1. Information we collect                            |
| • How we use it          | 2. How we use information                            |
| • Storage and access     | 3. Storage and access                                |
| • Weather requests       | 4. Weather requests                                  |
| • Sharing                | 5. Service providers and sharing                     |
| • Retention and deletion | 6. Retention and deletion                            |
| • Your choices           | 7. Your choices                                     |
| • Contact                | 8. Contact                                           |
+--------------------------+-------------------------------------------------------+
| [Manage Account] [Contact Us] [Terms of Use]                                      |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Manage Account -> `/profile` when authenticated; otherwise login redirect. Contact -> `/contact`; Terms -> `/terms`.

---

# 9. Terms of Use `/terms`

```text
+----------------------------------------------------------------------------------+
| PUBLIC NAVBAR                                                                     |
+----------------------------------------------------------------------------------+
| TERMS OF USE                                                                       |
| Last updated: [configured date]                                                   |
+--------------------------+-------------------------------------------------------+
| CONTENTS                 | TERMS CONTENT                                         |
| • Using the service      | 1. Using the service                                 |
| • Accounts               | 2. Accounts                                          |
| • AI predictions         | 3. AI predictions                                    |
| • Agricultural decisions | 4. Agricultural decisions                            |
| • Weather forecasts      | 5. Weather forecasts                                 |
| • Availability           | 6. Service availability                              |
| • Account deletion       | 7. Termination and deletion                          |
| • Contact                | 8. Contact                                           |
+--------------------------+-------------------------------------------------------+
| [Privacy Policy] [Create Account] [Contact Us]                                    |
+----------------------------------------------------------------------------------+
| PUBLIC FOOTER                                                                      |
+----------------------------------------------------------------------------------+
```

Privacy -> `/privacy`; Create Account -> `/signup`; Contact -> `/contact`.

---

# 10. Not Found / 404

```text
+----------------------------------------------------------------------------------+
|                              [BlightScan logo]                                    |
|                                                                                  |
|                                  404                                             |
|                         We couldn't find that page.                              |
|             The link may be outdated, or the page may have moved.                |
|                                                                                  |
|                     [Go Home]   [Go to Dashboard]                                |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

Go Home -> `/`. Dashboard -> `/dashboard` if authenticated, otherwise `/login?redirect=%2Fdashboard`. Implement the real UI in `app/not-found.tsx`.

---

# 11. Login `/login`

```text
+----------------------------------------------------------------------------------+
|                                  [BlightScan]                                     |
|                                                                                  |
|                               Welcome back                                       |
|       Log in to review your scans, monitor your fields, and check risk.           |
|                                                                                  |
|       Email                                                                       |
|       [Enter your email address.................................]                 |
|       Password                                                                    |
|       [Enter your password....................................] [eye]             |
|       [ ] Remember me                           [Forgot password?]                |
|       [                         Log in                         ]                  |
|       ------------------------ or continue with ------------------------           |
|       [                    Continue with Google                 ]                 |
|       Don't have an account? [Create an account]                                 |
|       [Terms of Use] [Privacy Policy]                                             |
+----------------------------------------------------------------------------------+
```

Login calls Supabase password auth. Eye toggles visibility. Forgot Password -> `/forgot-password`; Create account -> `/signup`. On success, redirect to a validated internal `redirect` path or `/dashboard`. Google OAuth returns through `/auth/callback`.

---

# 12. Sign Up `/signup`

```text
+----------------------------------------------------------------------------------+
|                                  [BlightScan]                                     |
|                         Create your BlightScan account                            |
|       Start recording leaf scans and organizing your tomato fields.               |
|                                                                                  |
|       Full name                                                                   |
|       [Enter your full name...................................]                   |
|       Email                                                                       |
|       [you@example.com........................................]                   |
|       Password                                                                    |
|       [Create a password......................................] [eye]             |
|       Confirm password                                                            |
|       [Re-enter your password.................................] [eye]             |
|       [ ] I agree to [Terms of Use] and [Privacy Policy]                          |
|       [                       Create Account                    ]                |
|       [                    Continue with Google                 ]                 |
|       Already have an account? [Log in]                                          |
+----------------------------------------------------------------------------------+
```

Create Account -> Supabase signup with farmer role. Validate matching passwords and consent. Success -> email confirmation message; Login -> `/login`.

---

# 13. Forgot Password `/forgot-password`

```text
+----------------------------------------------------------------------------------+
|                                  [BlightScan]                                     |
|                              Reset your password                                 |
|       Enter your account email to receive reset instructions.                     |
|                                                                                  |
|       Email                                                                       |
|       [Enter your account email...............................]                  |
|       [                     Send Reset Link                    ]                 |
|       [Back to login]                                                             |
+----------------------------------------------------------------------------------+
```

Submit calls `resetPasswordForEmail()` with `/reset-password` as redirect. Use a neutral confirmation to avoid exposing whether an account exists.

---

# 14. Reset Password `/reset-password`

```text
+----------------------------------------------------------------------------------+
|                                  [BlightScan]                                     |
|                           Choose a new password                                  |
|       Enter your new password below.                                              |
|                                                                                  |
|       New password                                                                |
|       [Enter a new password...................................] [eye]             |
|       Confirm password                                                            |
|       [Confirm your new password..............................] [eye]             |
|       [                     Update Password                   ]                  |
|                                                                                  |
|       Invalid/expired link? [Request a New Link]                                  |
+----------------------------------------------------------------------------------+
```

Update Password requires a valid recovery session and calls `supabase.auth.updateUser({ password })`. Request a New Link -> `/forgot-password`.

---

# 15. Auth Callback `/auth/callback`

No standard page design. Server/system flow:
1. Receive callback.
2. Exchange authorization code for Supabase session.
3. Set session cookies securely.
4. Validate intended redirect.
5. Redirect to `/dashboard` or safe intended destination.
6. On failure, redirect to `/login` with a safe error message.

---

# 16. Farmer Dashboard `/dashboard`

```text
+----------------------------------------------------------------------------------+
| TOP BAR: [Logo] BlightScan        [Search?]         [+ New Scan] [Theme] [Avatar] |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | Good [time of day], {first_name}                          |
| Dashboard            | Here's your tomato crop monitoring overview.               |
| New Scan             |                                                           |
| Scan History         | +-------------+ +-------------+ +-------------+ +-------+ |
| My Fields            | | Total Scans | | Diseased    | | Fields      | | High  | |
| Spread Risk Map      | | (count)     | | (count)     | | (count)     | | risk  | |
| Disease Library      | +-------------+ +-------------+ +-------------+ +-------+ |
| Settings             |                                                           |
|                      | +--------------------------------+ +--------------------+ |
|                      | | Risk Alerts                    | | Local Weather      | |
|                      | | Field, risk, reason [View]     | | Temp, humidity     | |
|                      | +--------------------------------+ +--------------------+ |
|                      |                                                           |
|                      | +--------------------------------+ +--------------------+ |
|                      | | Scans per week (bar chart)     | | Diagnosis breakdown| |
|                      | +--------------------------------+ +--------------------+ |
|                      |                                                           |
|                      | Recent Scans                          [View All]            |
|                      | [thumb] Early Blight 91% Field A [date] [Open]              |
|                      | [thumb] Healthy 96% Field B [date] [Open]                  |
+----------------------+-----------------------------------------------------------+
```

Clicks:
- + New Scan -> `/scan`
- Total Scans -> `/history`
- Diseased -> `/history?result=diseased`
- Fields -> `/fields`
- High Risk -> `/fields?risk=high`
- View Field -> `/fields/[id]`
- Scan row -> `/scan/[id]`
- View All -> `/history`
- Sidebar items -> their matching routes.

All statistics must come from user-scoped data, not hardcoded sample counts.

---

# 17. New Scan `/scan`

```text
+----------------------------------------------------------------------------------+
| TOP BAR / APP SHELL                                                               |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | Scan a tomato leaf                                        |
|                      | Choose a field, upload a photo, and run the classifier.   |
|                      |                                                           |
|                      | STEP 1 — CHOOSE FIELD                                    |
|                      | Field [Select a field (optional) v] [+ Add a field]      |
|                      |                                                           |
|                      | STEP 2 — ADD A PHOTO                                     |
|                      | +-----------------------------------------------------+ |
|                      | | [Upload] [Camera]                                   | |
|                      | |                                                     | |
|                      | |           [Image upload icon]                       | |
|                      | |       Drop your leaf photo here                     | |
|                      | |   Or choose an image from your device                | |
|                      | |       [Browse Files] [Capture Photo]                | |
|                      | |       JPG, PNG, WEBP · Max 5 MB                     | |
|                      | +-----------------------------------------------------+ |
|                      |                                                           |
|                      | STEP 3 — REVIEW PHOTO                                    |
|                      | [Preview image] [Retake] [Remove Photo]                   |
|                      | Notes (optional)                                         |
|                      | [Add observations or symptoms.......................]    |
|                      |                                                           |
|                      | Tips: one leaf · bright light · sharp focus              |
|                      | [                       Analyse Leaf                    ] |
+----------------------+-----------------------------------------------------------+
```

Clicks:
- Field selector chooses an owned field.
- + Add a field -> `/fields/new?return=/scan`.
- Browse Files opens file picker.
- Capture Photo requests camera access where supported.
- Retake reopens selection/camera.
- Remove Photo clears preview.
- Analyse Leaf validates, compresses, uploads privately, calls POST `/api/scans`, which calls FastAPI `/predict`; save result and optional forecast, then navigate to `/scan/[id]`.
- While running, disable repeat submissions and show “Analysing leaf…”.

---

# 18. Scan Result `/scan/[id]`

```text
+----------------------------------------------------------------------------------+
| APP SHELL                                                                         |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | Scan History / Scan Result                                |
|                      | Scan Result · [date] · [field]                            |
|                      |                                                           |
|                      | +-------------------------+ +---------------------------+ |
|                      | | [Leaf photo]            | | EARLY BLIGHT              | |
|                      | |                         | | Confidence: 91.4%         | |
|                      | |                         | | [confidence bar]          | |
|                      | +-------------------------+ +---------------------------+ |
|                      |                                                           |
|                      | Class Probabilities                                       |
|                      | Healthy       [--------------------] 3%                   |
|                      | Early Blight  [===================-] 91%                  |
|                      | Late Blight   [=-------------------] 6%                   |
|                      |                                                           |
|                      | What this result means                                    |
|                      | [Disease summary from library]                            |
|                      |                                                           |
|                      | 7-day spread-risk forecast                                |
|                      | [Risk badge] [Line chart] [Weather explanation]            |
|                      |                                                           |
|                      | Recommended next steps                                    |
|                      | [Organic & Cultural] [Chemical Options]                   |
|                      | [Treatment checklist]                                      |
|                      |                                                           |
|                      | [Scan Another Leaf] [View Field] [Download PDF]            |
|                      | [Share] [Request Expert Review] [Delete Scan]              |
|                      | [Back to History]                                           |
+----------------------+-----------------------------------------------------------+
```

- Scan Another Leaf -> `/scan`.
- View Field -> `/fields/[field_id]` when linked.
- Download PDF -> generate report from real scan data.
- Share -> copy URL; record stays protected.
- Request Expert Review -> PATCH `/api/scans/[id]/review`.
- Delete Scan -> confirmation, delete scan and image, then `/history`.
- Back to History -> `/history`.
- Organic/Chemical tabs switch the guidance content.
- Low confidence (<60%) shows a warning and suggests a clearer photo or review.
- Healthy results must not be presented as confirmed disease.

---

# 19. Scan History `/history`

```text
+----------------------------------------------------------------------------------+
| APP SHELL                                                                         |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | Scan History                              [Export CSV]     |
|                      | Review earlier scans and compare predictions.              |
|                      |                                                           |
|                      | [Search notes........] [Result v] [Field v] [Date range]  |
|                      | [Sort: Newest v] [Table] [Grid] [Clear filters]           |
|                      |                                                           |
|                      | [ ] PHOTO   RESULT        CONFIDENCE FIELD DATE ACTIONS    |
|                      | [ ] [img]   Early Blight  91%        North  date [View v]  |
|                      | [ ] [img]   Healthy       96%        South  date [View v]  |
|                      | [ ] [img]   Late Blight   84%        North  date [View v]  |
|                      |                                                           |
|                      | [Select page] [Delete Selected]                           |
|                      | [Previous]                         Page 1 of N [Next]      |
+----------------------+-----------------------------------------------------------+
```

- Search, result, field, date and sort filters update query parameters.
- View -> `/scan/[id]`.
- Delete -> confirmation and authorized delete API.
- Export CSV -> `/api/scans/export` with current filters.
- Pagination preserves filters.
- No records: “No scans yet” + “Start Your First Scan” -> `/scan`.
- No filter matches: “No matching scans” + “Clear Filters”.

---

# 20. My Fields `/fields`

```text
+----------------------------------------------------------------------------------+
| APP SHELL                                                                         |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | My Fields                                  [+ Add Field] |
|                      | Organize your tomato plots and monitor their risk.         |
|                      | [Search fields........] [Risk v] [Sort v]                  |
|                      |                                                           |
|                      | +-----------------------------+ +-----------------------+ |
|                      | | [Map/field image]           | | [Map/field image]    | |
|                      | | North Field                 | | South Field          | |
|                      | | Tomato · 2.5 acres          | | Tomato · 1.8 acres   | |
|                      | | [Low Risk]                  | | [High Risk]          | |
|                      | | Last scan: date             | | Last scan: date      | |
|                      | | [View Field] [⋯]            | | [View Field] [⋯]     | |
|                      | +-----------------------------+ +-----------------------+ |
+----------------------+-----------------------------------------------------------+
```

- Add Field -> `/fields/new`.
- View Field/card -> `/fields/[id]`.
- Edit -> `/fields/[id]?edit=1`.
- Delete -> confirmation; linked scans may remain with `field_id = null`.
- Search/risk/sort filters update displayed cards.
- Empty state: “Add your first field” and “Add Field” -> `/fields/new`.

---

# 21. Add Field `/fields/new`

```text
+----------------------------------------------------------------------------------+
| APP SHELL                                                                         |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | Add a field                                                |
|                      | Save your tomato plot to enable field-level forecasts.    |
|                      |                                                           |
|                      | Field name *                                                |
|                      | [e.g. North Field........................................] |
|                      | Crop                                                       |
|                      | [Tomato — supported crop]                                  |
|                      | Variety (optional)                                         |
|                      | [Enter tomato variety....................................] |
|                      | Area in acres *                                            |
|                      | [Enter field area........................................] |
|                      | Planting date                                              |
|                      | [Select date.................................]             |
|                      |                                                           |
|                      | Location                                                   |
|                      | [Interactive map — click to place pin]                    |
|                      | [Use My Location]                                          |
|                      | Latitude: (...) Longitude: (...)                           |
|                      |                                                           |
|                      | [Cancel]                                   [Save Field]    |
+----------------------+-----------------------------------------------------------+
```

- Map click moves pin.
- Use My Location requests geolocation permission.
- Save Field validates and inserts record; returns to validated `return` route or `/fields`.
- Cancel -> `/fields`.
- Location can be omitted, but the UI explains that forecasts require coordinates.

---

# 22. Field Details `/fields/[id]`

```text
+----------------------------------------------------------------------------------+
| APP SHELL                                                                         |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | My Fields / North Field                    [Edit Field]  |
|                      | Tomato · 2.5 acres · [variety] [Medium Risk]               |
|                      | [Scan in This Field] [Refresh Forecast] [Delete Field]    |
|                      |                                                           |
|                      | +------------------------------------------------------+ |
|                      | | FIELD LOCATION MAP                                   | |
|                      | | [Pin]                                                | |
|                      | +------------------------------------------------------+ |
|                      |                                                           |
|                      | 7-day spread-risk forecast                                |
|                      | [Risk badge] [Risk line chart]                            |
|                      |                                                           |
|                      | Local Weather                                             |
|                      | [Temperature] [Humidity] [Rainfall]                        |
|                      |                                                           |
|                      | Scans in This Field                                      |
|                      | [img] Early Blight 91% date [Open]                        |
|                      | [img] Healthy 96% date [Open]                             |
|                      | [View All Scans]                                         |
+----------------------+-----------------------------------------------------------+
```

- Scan in This Field -> `/scan?field=[id]`.
- Refresh Forecast -> POST `/api/fields/[id]/forecast`.
- Edit Field -> edit mode or `/fields/[id]?edit=1`.
- Delete Field -> confirmation.
- Scan row -> `/scan/[scan_id]`.
- View All Scans -> `/history?field=[id]`.
- If no coordinates or eligible scan, show a clear forecast-unavailable message.

---

# 23. Spread Risk Map `/spread-map`

```text
+----------------------------------------------------------------------------------+
| APP SHELL                                                                         |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | Spread Risk Map                 [Refresh All Forecasts]  |
|                      | View weather-driven risk across located fields.           |
|                      |                                                           |
|                      | [Risk: All v] [Low] [Medium] [High]                       |
|                      | +----------------------------------+--------------------+ |
|                      | |                                  | YOUR FIELDS        | |
|                      | |          INTERACTIVE MAP          | North Field [High] | |
|                      | |     (green/amber/red markers)     | South Field [Low]  | |
|                      | |                                  | East Field [Med]   | |
|                      | |                                  | [Open Field]       | |
|                      | +----------------------------------+--------------------+ |
|                      | Legend: ● Low  ● Medium  ● High                           |
|                      | Fields without coordinates: [Location needed]             |
+----------------------+-----------------------------------------------------------+
```

- Risk filter updates markers/list.
- Marker opens popup with field name, risk, score, latest diagnosis, updated time.
- Open Field -> `/fields/[id]`.
- Refresh All Forecasts -> POST `/api/forecast/refresh-all`; show progress, success or partial failure.
- Map pan/zoom changes viewport only.
- Fields without coordinates are listed separately.

---

# 24. Profile & Settings `/profile`

```text
+----------------------------------------------------------------------------------+
| APP SHELL                                                                         |
+----------------------+-----------------------------------------------------------+
| SIDEBAR              | Profile & Settings                                        |
|                      | Manage your details, security, and preferences.           |
|                      | [Profile] [Account] [Notifications] [Danger Zone]         |
|                      |                                                           |
|                      | PROFILE TAB                                              |
|                      | [Avatar] [Upload Avatar]                                 |
|                      | Full name [............................................] |
|                      | Phone     [............................................] |
|                      | State     [...................] District [.............] |
|                      | Language  [Select language v]                             |
|                      | [Save Changes]                                           |
+----------------------+-----------------------------------------------------------+
```

**Account tab:** read-only email, current/new/confirm password, Change Password.  
**Notifications tab:** high-risk email toggle, weekly summary toggle, Save Preferences. Persist each setting in the database.  
**Danger Zone tab:** warning text, input “Type DELETE to confirm”, Delete Account, Cancel.

Successful account deletion -> `/`. Deletion must be server-side and clear session and associated resources.

---

# 25. Admin Overview `/admin`

```text
+----------------------------------------------------------------------------------+
| ADMIN SHELL: [BlightScan] Admin Overview                         [Avatar]         |
+----------------------+-----------------------------------------------------------+
| ADMIN SIDEBAR        | Platform Overview                                         |
| Overview             | Monitor usage, scan activity, and the deployed model.     |
| Users                |                                                           |
| Scan Review          | +-------------+ +-------------+ +-------------+ +-------+ |
| Messages             | | Total Users | | Total Scans | | Today       | | Disease| |
|                      | +-------------+ +-------------+ +-------------+ +-------+ |
|                      |                                                           |
|                      | +--------------------------------+ +--------------------+ |
|                      | | Scan Activity chart             | | Active Model       | |
|                      | | Scans per day                   | | Version / metrics  | |
|                      | +--------------------------------+ +--------------------+ |
|                      |                                                           |
|                      | Scans Needing Review                                      |
|                      | [Photo] Prediction Confidence Date [Review]                |
|                      | [Manage Users] [Review Scans] [Contact Messages]           |
+----------------------+-----------------------------------------------------------+
```

- Total users -> `/admin/users`.
- Total scans/daily activity -> `/admin/scans`.
- Review row -> `/admin/scans`.
- Manage Users -> `/admin/users`.
- Review Scans -> `/admin/scans`.
- Contact Messages -> `/admin/messages`.
- Statistics come from admin-authorized `/api/admin/stats`.

---

# 26. User Management `/admin/users`

```text
+----------------------------------------------------------------------------------+
| ADMIN SHELL                                                                       |
+----------------------+-----------------------------------------------------------+
| ADMIN SIDEBAR        | User Management                                           |
|                      | Search accounts and manage access.                        |
|                      | [Search by name or email.................................] |
|                      |                                                           |
|                      | NAME       EMAIL       ROLE    SCANS  JOINED  STATUS ACTION|
|                      | Shazan     ...         Farmer  12     ...     Active [⋯] |
|                      | User B     ...         Expert  8      ...     Active [⋯] |
|                      | User C     ...         Farmer  4      ...     Active [⋯] |
|                      |                                                           |
|                      | [Previous]                         Page 1 of N [Next]      |
+----------------------+-----------------------------------------------------------+
```

- Search filters by name/email.
- Change Role opens Farmer/Expert/Admin dropdown; save -> PATCH `/api/admin/users/[id]`.
- Deactivate opens confirmation and updates server-side status.
- View Details, if implemented, opens a limited details drawer.
- Pagination changes page.
- Add and enforce an account status field before implementing deactivation.

---

# 27. Scan Review `/admin/scans`

```text
+----------------------------------------------------------------------------------+
| STAFF SHELL                                                                       |
+----------------------+-----------------------------------------------------------+
| REVIEW SIDEBAR       | Scan Review                                               |
|                      | Review uncertain predictions and record corrections.     |
|                      | [Search...] [Status v] [Confidence below 60%] [Date]     |
|                      |                                                           |
|                      | PHOTO  PREDICTION   CONFIDENCE FIELD STATUS     ACTION    |
|                      | [img]  Early Blight 54%        North  Requested [Review]  |
|                      | [img]  Late Blight  87%        South  Reviewed  [Review]  |
|                      |                                                           |
|                      | REVIEW DRAWER (opens when Review is clicked)              |
|                      | [Large leaf image]                                       |
|                      | Model prediction: Early Blight · Confidence: 54%         |
|                      | Correct Label [Healthy / Early / Late v]                |
|                      | Expert Notes [.........................................] |
|                      | [Cancel]                                  [Save Review]   |
+----------------------+-----------------------------------------------------------+
```

- Search/status/confidence filters update records.
- Review -> opens drawer.
- Correct Label selects one of the three classes.
- Save Review -> PATCH `/api/scans/[id]/review`, persist label/note/reviewer/time/status.
- Cancel/close -> closes drawer; warn if there are unsaved changes.
- Experts can review only authorized records and cannot manage users.

---

# 28. Contact Messages `/admin/messages`

```text
+----------------------------------------------------------------------------------+
| ADMIN SHELL                                                                       |
+----------------------+-----------------------------------------------------------+
| ADMIN SIDEBAR        | Contact Messages                                          |
|                      | Manage questions, feedback, and bug reports.             |
|                      | [Search sender or subject...] [Status v] [Subject v]     |
|                      |                                                           |
|                      | SENDER   EMAIL       SUBJECT       RECEIVED  STATUS ACTION|
|                      | User A   ...         Bug report    ...       Unread [Open] |
|                      | User B   ...         Feedback      ...       Read   [Open] |
|                      |                                                           |
|                      | MESSAGE DETAIL DRAWER                                     |
|                      | From: [name] <email>                                     |
|                      | Subject: [subject]                                       |
|                      | Message: [full message body]                             |
|                      | [Mark as Read] [Reply] [Delete] [Close]                  |
+----------------------+-----------------------------------------------------------+
```

- Search/status/subject filters update table.
- Open row -> message detail drawer.
- Mark as Read -> update `is_read = true`.
- Reply -> opens `mailto:<valid-sender-email>`; it does not claim to send the email.
- Delete -> confirmation then database deletion.
- Close -> closes drawer.

---

## 29. Global route and click map

```text
PUBLIC
  / --------------------------> /about, /diseases, /how-it-works, /contact
  /diseases ------------------> /diseases/early-blight
                           \--> /diseases/late-blight
  Public CTA -----------------> /signup or /scan

AUTH
  /login <--------------------> /signup
    |                            |
    v                            v
  /forgot-password             email confirmation
    |
    v
  /reset-password
  OAuth/email callback --------> /auth/callback --------> /dashboard

FARMER
  /dashboard -----------------> /scan
      |                         /history
      |                         /fields
      |                         /spread-map
      v
  /scan ----------------------> /scan/[id]
      |                             |
      |                             +--> /fields/[id]
      |                             +--> /history
      v
  /fields/new <--------------- /fields
      |
      +-----------------------> return path, e.g. /scan
  /fields/[id] ---------------> /scan?field=[id]
  /profile -------------------> update settings / delete account

ADMIN
  /admin ---------------------> /admin/users
      |                         /admin/scans
      |                         /admin/messages
      v
  Review scan ----------------> save expert review
```

---

## 30. Required global behavior

1. Every button and link must have a defined action.
2. Every form validates and displays loading, success, and error states.
3. Use actual database values; do not ship illustrative wireframe values as real data.
4. All private pages and APIs verify the Supabase session and role.
5. Farmers can access only their own scans and fields.
6. Experts can access only the review features and records they are authorized to handle.
7. Admin operations must be protected server-side.
8. Keep image storage private and use authorized signed URLs.
9. Destructive actions require confirmation and report success only after the backend confirms it.
10. Test responsive behavior, accessibility, upload failures, model timeouts, expired sessions, and empty states.

**Implementation order:** shared shell → authentication → scan upload/prediction/result → history → fields → forecasting/map → profile → public content → admin tools → security and deployment testing.
"""
output_path = "/mnt/data/BlightScan_Line_Drawn_Wireframes_All_Pages.md"
pypandoc.convert_text(content, "md", format="md", outputfile=output_path, extra_args=["--standalone"])
print(f"Created: {output_path}")
