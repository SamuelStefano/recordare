import { createContext, use } from 'react';
import type { Lang, TranslationKey } from '../lib/i18n';

export interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

export const LangContext = createContext<LangValue | null>(null);

export function useLang(): LangValue {
  const value = use(LangContext);
  if (!value) throw new Error('useLang() exige <LangProvider> acima na árvore.');
  return value;
}
