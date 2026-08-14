-- Campos que a loja e o kit de anúncio precisam e o schema inicial não tinha:
-- endereço estável da peça (slug), código do vendedor (sku), disponibilidade (stock),
-- ordem de vitrine (sort_order) e o par de identificadores do Mercado Livre.

alter table recordare.products add column if not exists slug text;
alter table recordare.products add column if not exists sku text;
alter table recordare.products add column if not exists stock integer not null default 0;
alter table recordare.products add column if not exists sort_order integer not null default 0;
alter table recordare.products add column if not exists ml_item_id text;
alter table recordare.products add column if not exists ml_permalink text;

update recordare.products as p set
  slug = v.slug,
  sku = v.sku,
  sort_order = v.sort_order,
  stock = v.stock
from (values
  ('p1',  'medalhao-oval-classico',            'REC-MED-001',  1, 40),
  ('p2',  'placa-retangular-memoria',          'REC-LAP-001',  2, 25),
  ('p3',  'porcelanato-capela-60x60',          'REC-POR-001',  3, 120),
  ('p4',  'placa-dupla-familia',               'REC-LAP-002',  4, 15),
  ('p5',  'placa-epitafio-personalizada',      'REC-LAP-003',  5, 30),
  ('p6',  'lapide-completa-granito',           'REC-LAP-004',  6, 6),
  ('p7',  'vaso-memorial-porcelana',           'REC-ACE-001',  7, 12),
  ('p8',  'medalhao-redondo-porcelana',        'REC-MED-002',  8, 45),
  ('p9',  'porcelanato-marmore-retrato-80x80', 'REC-POR-002',  9, 80),
  ('p10', 'medalhao-oval-bronze',              'REC-MED-003', 10, 22)
) as v(id, slug, sku, sort_order, stock)
where p.id = v.id;

-- Peça sem slug/sku é peça que não abre página nem entra no anúncio: preenche pelo id
-- em vez de deixar nulo e quebrar a rota mais tarde.
update recordare.products set slug = coalesce(slug, id) where slug is null;
update recordare.products set sku = coalesce(sku, 'REC-' || upper(id)) where sku is null;

alter table recordare.products alter column slug set not null;
alter table recordare.products alter column sku set not null;
do $do$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_stock_nonneg') then
    alter table recordare.products add constraint products_stock_nonneg check (stock >= 0);
  end if;
end
$do$;

create unique index if not exists products_slug_key on recordare.products (slug);
create unique index if not exists products_sku_key on recordare.products (sku);
create index if not exists products_sort_order_idx on recordare.products (sort_order);
