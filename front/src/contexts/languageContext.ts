import { createContext, useContext } from 'react';
import type { Lang } from '../i18n/translations';

export interface LanguageContextData {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // t(chave, vars?) — traduz e interpola {var}. Fallback: a própria chave.
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextData>({} as LanguageContextData);

export function useLanguage() {
  return useContext(LanguageContext);
}
