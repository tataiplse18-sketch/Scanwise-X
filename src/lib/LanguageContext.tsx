"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  translations,
  type Language,
  type TranslationKey,
} from "./translations";

export type ViewKey = "home" | "scan" | "search" | "history";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  view: ViewKey;
  setView: (view: ViewKey) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const LANG_STORAGE_KEY = "scanwise-lang";
const VIEW_STORAGE_KEY = "scanwise-view";

function readStoredLang(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    return saved === "en" || saved === "hi" ? saved : "en";
  } catch {
    return "en";
  }
}

function readStoredView(): ViewKey {
  if (typeof window === "undefined") return "home";
  try {
    const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (
      saved === "home" ||
      saved === "scan" ||
      saved === "search" ||
      saved === "history"
    ) {
      return saved;
    }
  } catch {
    /* ignore */
  }
  return "home";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from localStorage — runs only on client, no effect needed.
  const [lang, setLangState] = useState<Language>(readStoredLang);
  const [view, setViewState] = useState<ViewKey>(readStoredView);

  // Sync <html lang> attribute whenever lang changes (external system update)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Language = prev === "en" ? "hi" : "en";
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setView = useCallback((next: ViewKey) => {
    setViewState(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key] ?? translations.en[key],
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, t, view, setView }),
    [lang, setLang, toggleLang, t, view, setView]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside a LanguageProvider");
  }
  return ctx;
}
