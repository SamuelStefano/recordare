const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** URL absoluta de uma rota da loja, respeitando o subcaminho do deploy. */
export function siteUrl(path?: string) {
  const suffix = path === undefined ? window.location.pathname : `${BASE}${path}`;
  return `${window.location.origin}${suffix}`;
}
