import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, isLang, type Lang, type TranslationKey } from '../lib/i18n';
import { LangContext, type LangValue } from './lang-context';

const STORAGE_KEY = 'recordare.lang.v1';

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Navegador com storage bloqueado ainda precisa abrir a loja.
  }
  return typeof navigator !== 'undefined' && navigator.language.startsWith('en') ? 'en' : 'pt';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // O atributo lang do documento manda em leitor de tela, hifenização e tradução
  // automática do navegador; trocar só o texto na tela deixaria os três errados.
  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preferência perdida na próxima visita é melhor que tela branca.
    }
  }, []);

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: (key: TranslationKey) => dictionaries[lang][key] }),
    [lang, setLang]
  );

  return <LangContext value={value}>{children}</LangContext>;
}
