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
export default function SkatemapContent({ points }: { points: MapPoint[] }) {
    const { t } = useLanguage();
    return (
        <div className="container mx-auto pt-16 md:pt-24 pb-12 px-4">
            <div className="text-center mb-10 md:mb-14">
                <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">Skatemap</h1>
                <p className="text-muted-foreground mt-4 text-lg">{t("map.subtitle")}</p>
            </div>
            <SkateMap points={points} tall />
        </div>
    );
}
