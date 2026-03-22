"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { translations, type Locale, type Translations } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "hebeling-imperium-locale";
const LOCALE_EVENT = "hebeling-imperium-locale-change";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "es";
  }

  const savedLocale = localStorage.getItem(STORAGE_KEY);
  if (savedLocale === "en" || savedLocale === "es") {
    return savedLocale;
  }

  const browserLocale = window.navigator.language.toLowerCase();
  return browserLocale.startsWith("en") ? "en" : "es";
}

function subscribeLocale(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener("storage", handleChange);
  window.addEventListener(LOCALE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LOCALE_EVENT, handleChange);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    getInitialLocale,
    () => "es"
  );

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(STORAGE_KEY, newLocale);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  };

  const t = translations[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
