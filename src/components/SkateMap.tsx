"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { ROAD_SVG, SHOP_SVG, PARK_SVG } from "@/lib/mapIcons";
import { trackEvent } from "@/lib/analytics";

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

const makeIcon = (html: string, className: string) => L.divIcon({
    html,
    className,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
});
const spotIcon = makeIcon(ROAD_SVG, "curbside-spot-icon");
const shopIcon = makeIcon(SHOP_SVG, "curbside-shop-icon");
const parkIcon = makeIcon(PARK_SVG, "curbside-park-icon");
const ICONS: Record<string, { svg: string; icon: L.DivIcon }> = {
    spot: { svg: ROAD_SVG, icon: spotIcon },
    shop: { svg: SHOP_SVG, icon: shopIcon },
    park: { svg: PARK_SVG, icon: parkIcon },
};

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
export default function SkateMap({ points, tall = false }: { points: MapPoint[]; tall?: boolean }) {
    const { t } = useLanguage();
    const [active, setActive] = useState<string[]>(TYPES.map((x) => x.id));
    useEffect(() => { trackEvent("skatemap-geoeffnet", "Skatemap geöffnet"); }, []);

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
                        <span className="h-4 w-4" dangerouslySetInnerHTML={{ __html: ICONS[type.id].svg }} />
                        {t(`map.type_${type.id}`)} ({counts[type.id] || 0})
                    </button>
                ))}
                <a
                    href={suggestHref}
                    onClick={() => trackEvent("skatemap-eintragen", "Skatemap: Shop/Spot eintragen")}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-black uppercase italic hover:opacity-90 transition-opacity"
                >
                    <Plus className="h-4 w-4" />
                    {t("map.suggest")}
                </a>
            </div>

            <div className={cn("w-full overflow-hidden rounded-2xl border-2 border-border", tall ? "h-[70vh] min-h-[420px]" : "h-[60vh] min-h-[360px]")}>
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
                        // Jede Kategorie mit eigenem Symbol (Straße, Laden, Halfpipe)
                        return (
                            <Marker key={`${p.type}-${p.id}`} position={[p.lat, p.lng]} icon={ICONS[p.type]?.icon || spotIcon}>
                                {popup}
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
            {points.length === 0 && <p className="text-sm italic text-muted-foreground">{t("map.empty")}</p>}
        </div>
    );
}
