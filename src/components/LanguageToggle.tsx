"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

// DE/EN-Umschalter im Header (gleicher Stil wie der ThemeToggle)
export function LanguageToggle() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex bg-muted rounded-md p-0.5 border border-border" role="group" aria-label="Sprache / Language">
            {(["de", "en"] as const).map((lang) => (
                <button
                    key={lang}
                    type="button"
                    onClick={() => setLocale(lang)}
                    aria-pressed={locale === lang}
                    title={lang === "de" ? "Deutsch" : "English"}
                    className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider transition-colors",
                        locale === lang ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {lang}
                </button>
            ))}
        </div>
    );
}

// Kleiner Text-Baustein, damit auch Server-Seiten (z. B. Archiv) übersetzt werden können
export function T({ k }: { k: string }) {
    const { t } = useLanguage();
    return <>{t(k)}</>;
}
