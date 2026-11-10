"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const SUGGEST_MAIL = "steffen.or+curbside@gmail.com";

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

// Eigenes Straßen-Symbol für Street-Spots: orange Runde, Straße in Perspektive mit Mittelstreifen
const ROAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <circle cx="16" cy="16" r="14.5" fill="#f97316" stroke="#fff" stroke-width="2.5"/>
  <g stroke="#fff" stroke-linecap="round" fill="none">
    <path d="M13.2 8.5 L8 24.5" stroke-width="2.2"/>
    <path d="M18.8 8.5 L24 24.5" stroke-width="2.2"/>
    <path d="M16 9 V11" stroke-width="1.6"/>
    <path d="M16 14 V17" stroke-width="1.9"/>
    <path d="M16 20.5 V24.5" stroke-width="2.2"/>
  </g>
</svg>`;

// Eigenes Laden-Symbol für Skateshops: grüne Runde, Ladenfront mit gestreifter Markise und Tür
const SHOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <circle cx="16" cy="16" r="14.5" fill="#16a34a" stroke="#fff" stroke-width="2.5"/>
  <path d="M8.5 10.5 L10 7.5 H22 L23.5 10.5 Z" fill="#fff"/>
  <path d="M8.5 10.5 a1.875 1.875 0 0 0 3.75 0 a1.875 1.875 0 0 0 3.75 0 a1.875 1.875 0 0 0 3.75 0 a1.875 1.875 0 0 0 3.75 0 Z" fill="#fff"/>
  <path d="M10 13.2 V24 H22 V13.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
  <rect x="17.2" y="16.5" width="3.2" height="7.5" fill="#fff"/>
  <rect x="11.6" y="16.5" width="3.8" height="3.2" fill="#fff"/>
</svg>`;

const makeIcon = (html: string, className: string) => L.divIcon({
    html,
    className,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
});
const spotIcon = makeIcon(ROAD_SVG, "curbside-spot-icon");
const shopIcon = makeIcon(SHOP_SVG, "curbside-shop-icon");

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

    // Öffnet das Mailprogramm mit einer Vorlage (wie "Kontakt & Vorschläge" im Footer)
    const suggestHref = `mailto:${SUGGEST_MAIL}?subject=${encodeURIComponent(t("map.suggest_subject"))}&body=${encodeURIComponent(t("map.suggest_body"))}`;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
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
                        {type.id === "spot" || type.id === "shop" ? (
                            <span className="h-4 w-4" dangerouslySetInnerHTML={{ __html: type.id === "spot" ? ROAD_SVG : SHOP_SVG }} />
                        ) : (
                            <span className="h-3 w-3 rounded-full" style={{ background: type.color }} />
                        )}
                        {t(`map.type_${type.id}`)} ({counts[type.id] || 0})
                    </button>
                ))}
                <a
                    href={suggestHref}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-black uppercase italic hover:opacity-90 transition-opacity"
                >
                    <Plus className="h-4 w-4" />
                    {t("map.suggest")}
                </a>
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
                        const popup = (
                            <Popup>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase" style={{ color }}>{t(`map.type_${p.type}`)}</p>
                                    <p className="text-base font-black">{p.name}</p>
                                    {p.address && <p className="text-sm">{p.address}</p>}
                                    {p.description && <p className="text-sm">{p.description}</p>}
                                    {p.url && p.url !== "#" && (
                                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold">
                                            {t(p.url.includes("google.com/maps") ? "map.open_maps" : "map.open_link")} →
                                        </a>
                                    )}
                                </div>
                            </Popup>
                        );
                        // Spots mit Straßen-Symbol, Shops mit Laden-Symbol, Parks als blaue Punkte
                        return p.type === "spot" || p.type === "shop" ? (
                            <Marker key={`${p.type}-${p.id}`} position={[p.lat, p.lng]} icon={p.type === "spot" ? spotIcon : shopIcon}>
                                {popup}
                            </Marker>
                        ) : (
                            <CircleMarker
                                key={`${p.type}-${p.id}`}
                                center={[p.lat, p.lng]}
                                radius={8}
                                pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 0.9 }}
                            >
                                {popup}
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            </div>
            {points.length === 0 && <p className="text-sm italic text-muted-foreground">{t("map.empty")}</p>}
        </div>
    );
}
