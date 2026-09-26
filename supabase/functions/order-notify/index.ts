// Aviso de pedido novo. A loja grava em `recordare.orders` e, sem isto, ninguém fica sabendo: a
// chave publicável não lê pedidos, então não existe painel no site. Um Database Webhook no INSERT
// de `orders` chama esta função, que repassa o pedido para os canais configurados.
//
// Cada canal liga sozinho quando o segredo dele existe — nenhum é obrigatório:
//   ORDER_NOTIFY_SECRET                       obrigatório; o webhook manda em `x-webhook-secret`
//   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID     mensagem no celular, grátis
//   RESEND_API_KEY + ORDER_NOTIFY_EMAIL_TO    e-mail (ORDER_NOTIFY_EMAIL_FROM opcional)
//   ORDER_NOTIFY_WEBHOOK_URL                  JSON para n8n, Zapier, Make, planilha, CRM
import { summarize, sameSecret, toHtml, toText, type OrderRecord, type ProductName } from './message.ts';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  record: OrderRecord | null;
}

const env = (name: string) => Deno.env.get(name) ?? '';

// Nomes das peças pela chave anônima, que só enxerga o catálogo ativo: a função não precisa de
// service_role para montar uma mensagem, e credencial que ela não tem não vaza.
async function productNames(ids: string[]): Promise<ProductName[]> {
  const url = `${env('SUPABASE_URL')}/rest/v1/products?select=id,name_pt&id=in.(${ids
    .map((id) => `"${id.replace(/"/g, '')}"`)
    .join(',')})`;
  const key = env('SUPABASE_ANON_KEY');
  // Sem nomes o aviso sai com os ids das peças: perder o aviso por causa disso é pior.
  try {
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'recordare' },
    });
    return response.ok ? ((await response.json()) as ProductName[]) : [];
  } catch (cause) {
    console.error(`catálogo indisponível para o aviso: ${cause}`);
    return [];
  }
}

async function ensureOk(channel: string, response: Response): Promise<string> {
  if (!response.ok) throw new Error(`${channel}: HTTP ${response.status} ${await response.text()}`);
  return channel;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!sameSecret(request.headers.get('x-webhook-secret'), env('ORDER_NOTIFY_SECRET'))) {
    return new Response('unauthorized', { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as WebhookPayload | null;
  const order = payload?.record;
  if (payload?.type !== 'INSERT' || payload.table !== 'orders' || !order) {
    return new Response('ignored', { status: 202 });
  }

  const summary = summarize(order, await productNames(order.items.map((item) => item.id)));
  const sends: Promise<string>[] = [];

  if (env('TELEGRAM_BOT_TOKEN') && env('TELEGRAM_CHAT_ID')) {
    sends.push(
      fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env('TELEGRAM_CHAT_ID'), text: toText(summary) }),
      }).then((r) => ensureOk('telegram', r))
    );
  }

  if (env('RESEND_API_KEY') && env('ORDER_NOTIFY_EMAIL_TO')) {
    sends.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env('ORDER_NOTIFY_EMAIL_FROM') || 'Recordare <onboarding@resend.dev>',
          to: env('ORDER_NOTIFY_EMAIL_TO').split(',').map((to) => to.trim()),
          subject: `Pedido novo ${summary.reference} · ${summary.customer}`,
          text: toText(summary),
          html: toHtml(summary),
        }),
      }).then((r) => ensureOk('email', r))
    );
  }

  if (env('ORDER_NOTIFY_WEBHOOK_URL')) {
    sends.push(
      fetch(env('ORDER_NOTIFY_WEBHOOK_URL'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'order.created', order: summary }),
      }).then((r) => ensureOk('webhook', r))
    );
  }

  if (sends.length === 0) {
    console.warn(`pedido ${summary.reference}: nenhum canal configurado`);
    return Response.json({ sent: [], failed: [] });
  }

  const results = await Promise.allSettled(sends);
  const sent = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  const failed = results.flatMap((r) => (r.status === 'rejected' ? [String(r.reason)] : []));
  // O pedido já está gravado; falha aqui é só o aviso. Fica no log da função para alguém ver.
  for (const reason of failed) console.error(`pedido ${summary.reference}: ${reason}`);

  return Response.json({ sent, failed: failed.length }, { status: sent.length ? 200 : 502 });
});
