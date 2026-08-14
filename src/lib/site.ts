const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * URL absoluta e canônica de uma rota, respeitando o subcaminho do deploy. A barra final é
 * obrigatória: o GitHub Pages redireciona `/peca/x` para `/peca/x/`, e um canonical que redireciona
 * é tratado como erro pelo Google.
 */
export function siteUrl(path?: string) {
  if (path === undefined) return `${window.location.origin}${window.location.pathname}`;
  const suffix = path === '/' ? '/' : `${path.replace(/\/$/, '')}/`;
  return `${window.location.origin}${BASE}${suffix}`;
}

/**
 * Card de compartilhamento das telas que não são de uma peça específica. Servido pela própria loja
 * porque a venda circula por WhatsApp: link sem imagem some no meio da conversa, e o host das fotos
 * de catálogo já respondeu 429 em rajada — não dá para depender dele no preview.
 */
export function shareImage() {
  return `${window.location.origin}${BASE}/og.png`;
}
