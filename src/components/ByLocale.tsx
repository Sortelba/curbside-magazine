"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/context/LanguageContext";

// Zeigt je nach Sprache den deutschen oder englischen Block (für längere Texte wie Impressum/AGB)
export default function ByLocale({ de, en }: { de: ReactNode; en: ReactNode }) {
    const { locale } = useLanguage();
    return <>{locale === "en" ? en : de}</>;
}
