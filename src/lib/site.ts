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
