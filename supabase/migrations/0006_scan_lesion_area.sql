-- Diseased leaf area with each scan (ml-service/app/severity.py).
-- severity is now graded from this area (< 25 % low, 25–50 % moderate, > 50 % high) instead of the
-- classifier's confidence. Older scans keep null in these columns.

alter table scans
  add column diseased_area numeric(4, 1) check (diseased_area between 0 and 100), -- % of the leaf with lesions
  add column severity_reliable boolean,  -- false: busy background or not a single leaf, so the area is rough
  add column lesion_mask text check (char_length(lesion_mask) <= 20000); -- transparent PNG data URL, same framing as the photo
