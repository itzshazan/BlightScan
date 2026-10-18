-- Storage buckets and policies (spec 5.3).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('leaf-images', 'leaf-images', false, 6291456, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('disease-images', 'disease-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- leaf-images (private): users work only inside {user_id}/; staff can read everything.
-- Served to the browser with 1-hour signed URLs.
create policy "leaf: own upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'leaf-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "leaf: own or staff read" on storage.objects
  for select to authenticated
  using (bucket_id = 'leaf-images' and ((storage.foldername(name))[1] = auth.uid()::text or my_role() in ('expert', 'admin')));
create policy "leaf: own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'leaf-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- avatars (public read): users write only {user_id}/avatar.jpg
create policy "avatars: own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- disease-images (public read): admins write
create policy "disease-images: admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'disease-images' and my_role() = 'admin')
  with check (bucket_id = 'disease-images' and my_role() = 'admin');
