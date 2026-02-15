"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import translations from "@/data/translations.json";

type Locale = "de" | "en";

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>("de");

    // Load preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("curbside_locale") as Locale;
        if (saved && (saved === "de" || saved === "en")) {
            setLocale(saved);
        }
    }, []);

    const handleSetLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem("curbside_locale", newLocale);
    };

    const t = (path: string) => {
        const keys = path.split(".");
        let current: any = translations[locale];

        for (const key of keys) {
            if (current && current[key]) {
                current = current[key];
            } else {
                return path; // Fallback to key
            }
        }

        return current;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
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
