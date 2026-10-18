-- Live weather with each scan, and spread forecasts for scans that aren't in a mapped field.

-- Where the photo was taken (field pin or phone GPS, rounded to ~100 m) and the conditions at that moment:
-- {"temperature":21.4,"humidity":94,"rain_24h":3.2,"humid_hours_24h":11,"early_hours_24h":0,
--  "late_hours_24h":9,"favours":"late_blight","source":"open-meteo","captured_at":"…"}
alter table scans
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add column weather jsonb;

-- A forecast belongs to a field, or (field_id null) to the scan whose location it used.
alter table spread_predictions alter column field_id drop not null;
alter table spread_predictions add constraint spread_target check (field_id is not null or scan_id is not null);

-- With field_id null, "on delete set null" on scan_id would break the check above, so forecasts are
-- removed with the scan that produced them.
alter table spread_predictions drop constraint spread_predictions_scan_id_fkey;
alter table spread_predictions
  add constraint spread_predictions_scan_id_fkey foreign key (scan_id) references scans (id) on delete cascade;
create index on spread_predictions (scan_id);

-- Owners can read forecasts for their fields and for their own scans.
drop policy "spread: owner read" on spread_predictions;
create policy "spread: owner read" on spread_predictions
  for select to authenticated
  using (
    exists (select 1 from fields f where f.id = field_id and f.user_id = auth.uid())
    or exists (select 1 from scans s where s.id = scan_id and s.user_id = auth.uid())
  );
