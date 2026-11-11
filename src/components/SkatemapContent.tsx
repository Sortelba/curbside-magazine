"use client";

import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";
import type { MapPoint } from "@/components/SkateMap";

// Leaflet braucht das Browser-Fenster → nur im Browser laden
const SkateMap = dynamic(() => import("@/components/SkateMap"), {
    ssr: false,
    loading: () => <div className="h-[70vh] min-h-[420px] w-full rounded-2xl border-2 border-border bg-muted animate-pulse" />,
});

// Eigene Seite /skatemap/
export default function SkatemapContent({ points, updated }: { points: MapPoint[]; updated?: string }) {
    const { t, locale } = useLanguage();
    // "2026-11-11" → "11. November 2026" / "November 11, 2026"
    const updatedLabel = updated && /^\d{4}-\d{2}-\d{2}$/.test(updated)
        ? new Date(`${updated}T12:00:00`).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", { day: "numeric", month: "long", year: "numeric" })
        : "";
    return (
        <div className="container mx-auto pt-16 md:pt-24 pb-12 px-4">
            <div className="text-center mb-10 md:mb-14">
                <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">Skatemap</h1>
                <p className="text-muted-foreground mt-4 text-lg">{t("map.subtitle")}</p>
            </div>
            <SkateMap points={points} tall />
            {updatedLabel && (
                <p className="mt-3 text-right text-xs text-muted-foreground">
                    {t("map.last_updated")}: {updatedLabel}
                </p>
            )}
        </div>
    );
}
