-- Row Level Security (spec 5.2), tightened:
--   * scans and spread_predictions are written only by the Next.js API routes with the service
--     role key, after they check the session, so a user can't insert a forged diagnosis;
--   * role / status changes go through the admin API route (see protect_profile_columns).

alter table profiles enable row level security;
alter table fields enable row level security;
alter table scans enable row level security;
alter table spread_predictions enable row level security;
alter table diseases enable row level security;
alter table contact_messages enable row level security;
alter table model_versions enable row level security;

-- profiles
create policy "profiles: read own, admin reads all" on profiles
  for select to authenticated using (id = auth.uid() or my_role() = 'admin');
create policy "profiles: update own" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- fields: owner has full access; staff can read (to show field names while reviewing)
create policy "fields: owner all" on fields
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "fields: staff read" on fields
  for select to authenticated using (my_role() in ('expert', 'admin'));

-- scans: owner reads and deletes; staff read. Inserts and updates use the service role.
create policy "scans: owner read" on scans
  for select to authenticated using (user_id = auth.uid());
create policy "scans: owner delete" on scans
  for delete to authenticated using (user_id = auth.uid());
create policy "scans: staff read" on scans
  for select to authenticated using (my_role() in ('expert', 'admin'));

-- spread predictions: visible to the field's owner and staff
create policy "spread: owner read" on spread_predictions
  for select to authenticated
  using (exists (select 1 from fields f where f.id = field_id and f.user_id = auth.uid()));
create policy "spread: staff read" on spread_predictions
  for select to authenticated using (my_role() in ('expert', 'admin'));

-- diseases + model versions: public read, admin write
create policy "diseases: public read" on diseases for select using (true);
create policy "diseases: admin write" on diseases
  for all to authenticated using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "models: public read" on model_versions for select using (true);

-- contact messages: anyone can send; only admins read, mark and delete
create policy "contact: anyone inserts" on contact_messages
  for insert to anon, authenticated with check (is_read = false);
create policy "contact: admin read" on contact_messages
  for select to authenticated using (my_role() = 'admin');
create policy "contact: admin update" on contact_messages
  for update to authenticated using (my_role() = 'admin');
create policy "contact: admin delete" on contact_messages
  for delete to authenticated using (my_role() = 'admin');
