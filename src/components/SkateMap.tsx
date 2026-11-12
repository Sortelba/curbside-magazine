"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Plus, LocateFixed, Loader2 } from "lucide-react";
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

// Eigener Standort: blauer Punkt mit hellem Ring
const meIcon = L.divIcon({
    html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 1px 4px rgba(0,0,0,.4)"></span>',
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371, toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

// Fliegt zu einem Ziel (eigener Standort oder ein Spot aus der "In deiner Nähe"-Liste)
function FlyTo({ target }: { target: { lat: number; lng: number; zoom: number; n: number } | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.2 });
    }, [map, target]);
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

    // "In meiner Nähe": Browser fragt nach Erlaubnis, Standort bleibt nur im Browser
    const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [locError, setLocError] = useState<string | null>(null);
    const [target, setTarget] = useState<{ lat: number; lng: number; zoom: number; n: number } | null>(null);
    // Link aus einem News-Beitrag (/skatemap/?at=49.01,8.40&z=12) → direkt zur Stelle springen
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const m = params.get("at")?.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
        const z = Number(params.get("z"));
        if (m) setTarget({ lat: Number(m[1]), lng: Number(m[2]), zoom: z >= 3 && z <= 18 ? z : 16, n: Date.now() });
    }, []);
    const locate = () => {
        setLocError(null);
        if (!("geolocation" in navigator)) { setLocError(t("map.loc_unsupported")); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMe(here);
                setTarget({ ...here, zoom: 13, n: Date.now() });
                setLocating(false);
                trackEvent("skatemap-naehe", "Skatemap: In meiner Nähe");
            },
            (err) => {
                setLocating(false);
                setLocError(t(err.code === err.PERMISSION_DENIED ? "map.loc_denied" : "map.loc_error"));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    };
    const nearby = useMemo(() => {
        if (!me) return [];
        return visible
            .map((p) => ({ p, km: distanceKm(me, p) }))
            .sort((a, b) => a.km - b.km)
            .slice(0, 5);
    }, [me, visible]);
    const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`);

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
                <button
                    type="button"
                    onClick={locate}
                    disabled={locating}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-foreground text-sm font-black uppercase italic transition-all hover:bg-foreground hover:text-background disabled:opacity-60"
                >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                    {locating ? t("map.locating") : t("map.near_me")}
                </button>
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
                    <FlyTo target={target} />
                    {me && (
                        <Marker position={[me.lat, me.lng]} icon={meIcon} zIndexOffset={1000}>
                            <Popup><p className="text-sm font-black">{t("map.you_are_here")}</p></Popup>
                        </Marker>
                    )}
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
            {locError && <p className="text-sm font-bold text-red-600">{locError}</p>}
            {nearby.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-lg font-black uppercase italic tracking-tight">{t("map.nearby_title")}</h2>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                        {nearby.map(({ p, km }) => (
                            <button
                                key={`near-${p.type}-${p.id}`}
                                type="button"
                                onClick={() => setTarget({ lat: p.lat, lng: p.lng, zoom: 16, n: Date.now() })}
                                className="text-left rounded-xl border-2 border-border bg-card p-3 hover:border-foreground transition-colors"
                            >
                                <p className="text-xs font-bold uppercase" style={{ color: TYPES.find((x) => x.id === p.type)?.color }}>
                                    {t(`map.type_${p.type}`)} · {fmtKm(km)}
                                </p>
                                <p className="text-sm font-black leading-tight line-clamp-2">{p.name}</p>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("map.loc_privacy")}</p>
                </div>
            )}
            {points.length === 0 && <p className="text-sm italic text-muted-foreground">{t("map.empty")}</p>}
        </div>
    );
}
