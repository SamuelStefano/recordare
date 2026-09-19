const WIDTHS = [320, 640, 960, 1280];

/**
 * `sizes` sem `srcset` não faz nada: hoje a miniatura de 90px do carrinho baixa a mesma imagem de
 * 700px do topo da página da peça. As fotos do catálogo são servidas com `?width=`, então dá para
 * pedir a largura certa. Sem esse parâmetro não há como redimensionar — melhor devolver nada do
 * que inventar uma URL que responde 404.
 */
export function srcSetFor(src: string): string | undefined {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return undefined;
  }

  const original = Number(url.searchParams.get('width'));
  if (!Number.isFinite(original) || original <= 0) return undefined;

  const widths = [...new Set([...WIDTHS.filter((width) => width < original), original])];
  return widths
    .map((width) => {
      url.searchParams.set('width', String(width));
      return `${url.toString()} ${width}w`;
    })
    .join(', ');
}
