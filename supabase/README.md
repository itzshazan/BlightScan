# Supabase setup

Five migrations, run in order. They contain the schema, Row Level Security, storage buckets and seed data.

| File | What it does |
| --- | --- |
| `0001_schema.sql` | Enums, 7 tables, the trigger that creates a profile on signup, `my_role()` |
| `0002_rls.sql` | Row Level Security policies |
| `0003_storage.sql` | `leaf-images` (private), `avatars` and `disease-images` (public) buckets and their policies |
| `0004_seed.sql` | Model versions and the two disease library rows. Generated, see below. |
| `0005_scan_weather.sql` | Location and live weather on each scan; spread forecasts for scans without a field |

## 1. Create the project

1. Create a project at supabase.com. The free tier is enough.
2. Open **SQL Editor** and run the five files in order. With the Supabase CLI you can run `supabase link` and then `supabase db push` instead.
3. Open **Project Settings → API** and copy the values into `web/.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never commit it)

## 2. Auth settings (Authentication → URL Configuration / Providers)

- **Site URL:** `http://localhost:3000` while developing, then your Vercel URL.
- **Redirect URLs:** add `http://localhost:3000/**` and `https://<your-app>.vercel.app/**`. Sign-up confirmation, Google sign-in and password reset all return through `/auth/callback`.
- **Email** provider: on, with "Confirm email" on.
- **Google** provider: add the OAuth client ID and secret from Google Cloud Console. In Google, the authorised redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`.

## 3. Make yourself admin

Sign up through the app, then run in the SQL Editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

Change roles from **Admin → Users** after that.

## Security differences from the spec

The spec's policies are kept, with three things tightened. Each was checked against a local Postgres:

- **Users can't change their own role, status or email.** The spec's "own profile update" policy would have let anyone make themselves admin. The `protect_profile_columns` trigger blocks it.
- **Scans and forecasts are written only by the server** (service role in `/api/*`), after it checks the session. With the spec's "owner all" policy, anyone holding the public anon key could insert a forged diagnosis.
- **Deactivating a user also bans their login** (`/api/admin/users/[id]`), on top of the `status` column.

## Regenerating the seed

`0004_seed.sql` is generated from `web/lib/diseases.ts`, so the site and the database share one source:

```bash
node supabase/scripts/generate-seed.mjs
```

The migration is idempotent (`on conflict do update`), so you can re-run it after changing the content.
