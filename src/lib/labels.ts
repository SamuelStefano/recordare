import type { Category, Product } from './catalog';
import type { Lang, TranslationKey } from './i18n';
import { dictionaries } from './i18n';

const CATEGORY_KEY: Record<Category, TranslationKey> = {
  medalhoes: 'catMedalhoes',
  lapides: 'catLapides',
  porcelanato: 'catPorcelanato',
  acessorios: 'catAcessorios',
};

const CATEGORY_DESC_KEY: Record<Category, TranslationKey> = {
  medalhoes: 'catMedalhoesDesc',
  lapides: 'catLapidesDesc',
  porcelanato: 'catPorcelanatoDesc',
  acessorios: 'catAcessoriosDesc',
};

const COLOR_KEY: Record<string, TranslationKey> = {
  branco: 'colorBranco',
  marfim: 'colorMarfim',
  preto: 'colorPreto',
  cinza: 'colorCinza',
};

const FINISH_KEY: Record<string, TranslationKey> = {
  fosco: 'finishFosco',
  brilhante: 'finishBrilhante',
  acetinado: 'finishAcetinado',
};

export const COLOR_SWATCH: Record<string, string> = {
  branco: '#F4F1EA',
  marfim: '#EDE3CF',
  preto: '#2A2723',
  cinza: '#B9B2A6',
};

export const CATEGORIES: readonly Category[] = [
  'medalhoes',
  'lapides',
  'porcelanato',
  'acessorios',
];

export function categoryLabel(cat: Category, lang: Lang): string {
  return dictionaries[lang][CATEGORY_KEY[cat]];
}

export function categoryDescription(cat: Category, lang: Lang): string {
  return dictionaries[lang][CATEGORY_DESC_KEY[cat]];
}

// Valor desconhecido cai no próprio valor em vez de sumir da tela: um acabamento novo
// semeado no banco aparece cru, e não como espaço em branco no filtro.
export function colorLabel(color: string, lang: Lang): string {
  const key = COLOR_KEY[color];
  return key ? dictionaries[lang][key] : color;
}

export function finishLabel(finish: string, lang: Lang): string {
  const key = FINISH_KEY[finish];
  return key ? dictionaries[lang][key] : finish;
}

export function productName(product: Product, lang: Lang): string {
  return lang === 'en' ? product.name_en : product.name_pt;
}

export function productDescription(product: Product, lang: Lang): string {
  return lang === 'en' ? product.desc_en : product.desc_pt;
}

export function productBadge(product: Product, lang: Lang): string | null {
  return (lang === 'en' ? product.badge_en : product.badge_pt) ?? null;
}

export function variantLabel(
  lang: Lang,
  parts: { size?: string; color?: string; finish?: string }
): string {
  return [
    parts.size,
    parts.color ? colorLabel(parts.color, lang) : undefined,
    parts.finish ? finishLabel(parts.finish, lang) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}
