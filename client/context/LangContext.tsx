import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "bn" | "en";

interface LangContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

// Import translations
import { strings } from "@/locales/strings";

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage, default to Bangla
    const saved = localStorage.getItem("harvestguard_lang");
    return (saved as Language) || "bn";
  });

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("harvestguard_lang", lang);
  };

  // Translation function
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = strings[language];

    for (const k of keys) {
      value = value?.[k];
    }

    // Fallback to English if translation not found
    if (!value) {
      value = strings.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }

    return value || key;
  };

  return (
    <LangContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LangProvider");
  }
  return context;
}
