"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export type MapPoint = {
    id: string;
    name: string;
    type: "spot" | "park" | "shop";
    lat: number;
    lng: number;
    address?: string;
    url?: string;
    description?: string;
};

const TYPES = [
    { id: "park", color: "#2563eb" },
    { id: "spot", color: "#f97316" },
    { id: "shop", color: "#16a34a" },
] as const;

// Die Karte sitzt in einem animierten Fenster: Größe nachmessen, sobald es fertig aufgeklappt ist
function FixSize() {
    const map = useMap();
    useEffect(() => {
        const el = map.getContainer();
        const ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(el);
        const timers = [100, 400, 800].map((ms) => setTimeout(() => map.invalidateSize(), ms));
        return () => { ro.disconnect(); timers.forEach(clearTimeout); };
    }, [map]);
    return null;
}

// Karte mit allen Spots, Skateparks und Shops (OpenStreetMap)
export default function SkateMap({ points }: { points: MapPoint[] }) {
    const { t } = useLanguage();
    const [active, setActive] = useState<string[]>(TYPES.map((x) => x.id));

    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        points.forEach((p) => (c[p.type] = (c[p.type] || 0) + 1));
        return c;
    }, [points]);

    const visible = points.filter((p) => active.includes(p.type));
    const toggle = (id: string) =>
        setActive((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {TYPES.map((type) => (
                    <button
                        key={type.id}
                        type="button"
                        onClick={() => toggle(type.id)}
                        aria-pressed={active.includes(type.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-black uppercase italic transition-all",
                            active.includes(type.id) ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
                        )}
                    >
                        <span className="h-3 w-3 rounded-full" style={{ background: type.color }} />
                        {t(`map.type_${type.id}`)} ({counts[type.id] || 0})
                    </button>
                ))}
            </div>

            <div className="h-[60vh] min-h-[360px] w-full overflow-hidden rounded-2xl border-2 border-border">
                <MapContainer center={[51.2, 10.4]} zoom={6} scrollWheelZoom className="h-full w-full">
                    <FixSize />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {visible.map((p) => {
                        const color = TYPES.find((x) => x.id === p.type)?.color || "#000";
                        return (
                            <CircleMarker
                                key={`${p.type}-${p.id}`}
                                center={[p.lat, p.lng]}
                                radius={8}
                                pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 0.9 }}
                            >
                                <Popup>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase" style={{ color }}>{t(`map.type_${p.type}`)}</p>
                                        <p className="text-base font-black">{p.name}</p>
                                        {p.address && <p className="text-sm">{p.address}</p>}
                                        {p.description && <p className="text-sm">{p.description}</p>}
                                        {p.url && p.url !== "#" && (
                                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold">
                                                {t("map.open_link")} →
                                            </a>
                                        )}
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            </div>
            {points.length === 0 && <p className="text-sm italic text-muted-foreground">{t("map.empty")}</p>}
        </div>
    );
}
