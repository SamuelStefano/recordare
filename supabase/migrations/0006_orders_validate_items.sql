-- `orders` aceita insert anônimo, então o corpo do pedido é escolhido por quem envia. O trigger de
-- total já ignora o preço mandado pelo cliente, mas o `items` em si passava inteiro: dava para
-- gravar linha apontando para peça que não existe e quantidade de 9999 unidades. Nenhum dos dois
-- vira dinheiro (o total só soma peça ativa), mas ambos sujam a única fila de pedidos que existe.
-- A loja já se recusa a montar um carrinho assim; aqui a mesma regra passa a valer para quem fala
-- direto com a API.
--
-- PT422 chega no cliente como HTTP 422: distingue "seu carrinho envelheceu" de falha de rede, que
-- é a diferença entre "revise o carrinho" e "tente de novo".
create or replace function recordare.check_order_items()
returns trigger
language plpgsql
security definer
set search_path = recordare, pg_temp
as $$
declare
  invalidas integer;
begin
  -- O CASE existe porque `qty` é escolhido por quem envia: converter "abc" direto para número
  -- abortaria com erro de sintaxe em vez do PT422 que a loja sabe explicar.
  select count(*) into invalidas
  from (
    select
      i,
      case when jsonb_typeof(i->'qty') = 'number' then (i->'qty')::numeric end as qty
    from jsonb_array_elements(new.items) as i
  ) linha
  where jsonb_typeof(linha.i) <> 'object'
     or linha.i->>'id' is null
     or linha.qty is null
     or linha.qty <> trunc(linha.qty)
     or linha.qty not between 1 and 99
     or not exists (
       select 1 from recordare.products p where p.id = linha.i->>'id' and p.active
     );

  if invalidas > 0 then
    raise exception 'O carrinho tem peça fora do catálogo ou quantidade inválida.'
      using errcode = 'PT422';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_order_items on recordare.orders;
drop trigger if exists check_order_items on recordare.orders;
-- O nome importa: o Postgres dispara triggers do mesmo evento em ordem alfabética, e
-- `set_order_total` converte `qty` para inteiro sem rede de proteção. Com `check_` na frente de
-- `set_`, um qty de texto vira PT422 em vez do 22P02 cru que a loja não sabe traduzir.
create trigger check_order_items
  before insert on recordare.orders
  for each row execute function recordare.check_order_items();

revoke all on function recordare.check_order_items() from public, anon, authenticated;
