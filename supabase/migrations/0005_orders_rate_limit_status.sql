-- O freio de 0004 subia como erro genérico, e a loja respondia "tente de novo" — conselho errado,
-- porque tentar de novo falha pelos próximos 10 minutos. O PostgREST traduz SQLSTATE no formato
-- PTxxx para o status HTTP xxx, então PT429 chega no cliente como "muitas requisições" e permite
-- distinguir o freio de uma falha de rede sem adivinhar pela mensagem.
create or replace function recordare.throttle_orders()
returns trigger
language plpgsql
security definer
set search_path = recordare, pg_temp
as $$
declare
  recentes integer;
begin
  select count(*) into recentes
  from recordare.orders
  where phone = new.phone
    and created_at > now() - interval '10 minutes';

  if recentes >= 5 then
    raise exception 'Muitos pedidos em sequência para este telefone. Tente novamente em alguns minutos.'
      using errcode = 'PT429';
  end if;

  return new;
end;
$$;

revoke all on function recordare.throttle_orders() from public, anon, authenticated;
