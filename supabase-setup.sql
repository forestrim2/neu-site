-- 1) products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text,
  cover_image text,
  detail_images text[] default '{}',
  description text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

-- Public can read only public products
create policy "Public products are viewable by everyone"
on public.products for select
using (is_public = true or auth.role() = 'authenticated');

-- Only logged-in admin user can manage products
create policy "Authenticated users can insert products"
on public.products for insert
to authenticated
with check (true);

create policy "Authenticated users can update products"
on public.products for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete products"
on public.products for delete
to authenticated
using (true);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- 2) Storage bucket: create manually in Supabase UI
-- Bucket name: product-images
-- Public bucket: ON

-- Storage policies for public read and authenticated upload/update/delete
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

create policy "Authenticated users can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "Authenticated users can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');
