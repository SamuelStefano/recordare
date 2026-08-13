create schema if not exists recordare;

create table recordare.products (
  id          text primary key,
  cat         text not null check (cat in ('medalhoes','lapides','porcelanato','acessorios')),
  name_pt     text not null,
  name_en     text not null,
  desc_pt     text not null,
  desc_en     text not null,
  badge_pt    text,
  badge_en    text,
  price       numeric(10,2) not null check (price >= 0),
  unit        text not null check (unit in ('un','m2')),
  img         text not null,
  sizes       text[] not null default '{}',
  colors      text[] not null default '{}',
  finishes    text[] not null default '{}',
  rating      numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews     integer not null default 0 check (reviews >= 0),
  slot        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table recordare.orders (
  id           uuid primary key default gen_random_uuid(),
  customer     text not null check (length(btrim(customer)) between 2 and 120),
  phone        text not null check (phone ~ '^[0-9+() -]{8,20}$'),
  note         text check (length(note) <= 1000),
  items        jsonb not null check (jsonb_array_length(items) between 1 and 50),
  total        numeric(10,2) not null default 0,
  status       text not null default 'novo' check (status in ('novo','contatado','fechado','cancelado')),
  created_at   timestamptz not null default now()
);

create index on recordare.orders (created_at desc);

-- O total NUNCA vem do cliente: `orders` aceita insert anônimo, então um total
-- enviado pelo navegador é um número escolhido por quem quiser. Recalcula a partir
-- do preço vigente em `products` e ignora o que veio no corpo.
create or replace function recordare.set_order_total()
returns trigger
language plpgsql
set search_path = recordare, pg_temp
as $$
begin
  select coalesce(sum(p.price * greatest((i->>'qty')::int, 0)), 0)
    into new.total
  from jsonb_array_elements(new.items) as i
  join recordare.products p on p.id = i->>'id' and p.active;
  return new;
end;
$$;

create trigger set_order_total
  before insert or update on recordare.orders
  for each row execute function recordare.set_order_total();

alter table recordare.products enable row level security;
alter table recordare.orders   enable row level security;

-- Catálogo é vitrine pública. Escrita só via service_role (que ignora RLS).
create policy products_read_public on recordare.products
  for select to anon, authenticated using (active);

-- Pedido entra pelo carrinho e sai por WhatsApp: o site precisa INSERIR e nada
-- mais. Sem policy de select, o default-deny da RLS já esconde pedido de terceiro.
create policy orders_insert_public on recordare.orders
  for insert to anon, authenticated with check (true);

grant usage on schema recordare to anon, authenticated;
grant select on recordare.products to anon, authenticated;
grant insert on recordare.orders to anon, authenticated;
