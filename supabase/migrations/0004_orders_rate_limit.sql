-- A policy de insert em orders é aberta por necessidade: a loja não tem login. Sem nenhum freio,
-- qualquer um enche a tabela com pedidos falsos e enterra os de verdade. O telefone é a única
-- identidade disponível no payload, então é por ele que o freio funciona.
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
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists throttle_orders on recordare.orders;
create trigger throttle_orders
  before insert on recordare.orders
  for each row execute function recordare.throttle_orders();

revoke all on function recordare.throttle_orders() from public, anon, authenticated;
