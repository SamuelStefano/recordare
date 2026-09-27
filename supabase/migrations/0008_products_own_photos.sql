-- Troca as fotos de banco de imagem (Wikimedia) semeadas na 0002 pelas fotos do catálogo da
-- própria Recordare, servidas do bucket público `products` deste projeto. Com host próprio o
-- export do Mercado Livre deixa de marcar a peça como `NÃO PUBLIQUE`.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

update recordare.products as p
set img = v.img
from (values
  ('p1', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p1.jpg'),
  ('p2', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p2.jpg'),
  ('p3', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p3.jpg'),
  ('p4', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p4.jpg'),
  ('p5', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p5.jpg'),
  ('p6', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p6.jpg'),
  ('p7', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p7.jpg'),
  ('p8', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p8.jpg'),
  ('p9', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p9.jpg'),
  ('p10', 'https://qvoytjrfuyeammxsuwtx.supabase.co/storage/v1/object/public/products/p10.jpg')
) as v (id, img)
where p.id = v.id;
