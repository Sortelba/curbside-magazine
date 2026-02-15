"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import spotsData from "@/data/spots.json";
import { MapPin, ShoppingBag, Info, Navigation } from "lucide-react";

// Fix for default marker icons and custom ones
const createIcon = (color: string, isShop: boolean, isRecent: boolean = false) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="position: relative;">
                <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; items-center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <div style="transform: rotate(45deg); color: white;">${isShop ? '🛒' : '🛹'}</div>
                </div>
                ${isRecent ? `
                    <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #f43f5e; color: white; font-size: 7px; font-weight: 900; padding: 2px 4px; border-radius: 4px; border: 1px solid white; white-space: nowrap; z-index: 10;">
                        NEW
                    </div>
                ` : ''}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const spotIcon = createIcon("#10b981", false); // Emerald
const shopIcon = createIcon("#3b82f6", true);  // Blue

// Helper to update map size on container resize
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
}

export default function LeafletMap() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>("All");

    const categories = ["All", "Streetspots", "Skateparks", "Shops"];

    interface Spot {
        id: string;
        name: string;
        description: string;
        category: string;
        pos: number[];
        createdAt?: string;
    }

    const filteredSpots = useMemo(() => {
        const spots = spotsData as Spot[];
        return spots.filter(s => {
            if (activeCategory === "All") return true;

            const cat = s.category?.toLowerCase() || "";
            if (activeCategory === "Streetspots") {
                return cat.includes("street") || cat.includes("stuttgart") || cat.includes("untitled");
            }
            if (activeCategory === "Skateparks") {
                return cat.includes("park");
            }
            if (activeCategory === "Shops") {
                return cat.includes("shop");
            }
            return false;
        });
    }, [activeCategory]);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-[75vh] rounded-3xl bg-muted animate-pulse flex items-center justify-center border-2 border-border shadow-2xl">
                <p className="text-muted-foreground font-black uppercase italic tracking-widest">Loading Map Engine...</p>
            </div>
        );
    }

    const tileUrl = resolvedTheme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    return (
        <div className="flex flex-col gap-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase italic transition-all border ${activeCategory === cat
                            ? "bg-foreground text-background border-foreground shadow-lg"
                            : "bg-muted text-muted-foreground border-border hover:border-foreground/50"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="w-full h-[75vh] rounded-[2.5rem] overflow-hidden border-4 border-border shadow-2xl relative z-10 group">
                <div className="absolute top-6 left-14 z-[1000] flex flex-col gap-2 pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-border shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                        <p className="text-xs font-black uppercase italic tracking-widest text-foreground flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
                            {filteredSpots.length} Locations active
                        </p>
                    </div>
                    {activeCategory !== "All" && (
                        <div className="bg-primary/95 text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic tracking-tighter w-fit">
                            Filtering: {activeCategory}
                        </div>
                    )}
                </div>

                <MapContainer
                    center={[48.7758, 9.1829]} // Center on Stuttgart initially as it's a main cluster
                    zoom={12}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                >
                    <TileLayer
                        attribution={attribution}
                        url={tileUrl}
                    />

                    {filteredSpots.map(spot => {
                        const isShop = spot.category?.toLowerCase().includes("shop");

                        // Check if spot is new (last 7 days)
                        let isRecent = false;
                        if (spot.createdAt) {
                            const createdDate = new Date(spot.createdAt);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays <= 7) isRecent = true;
                        }

                        const icon = createIcon(isShop ? "#3b82f6" : "#10b981", isShop, isRecent);

                        return (
                            <Marker
                                key={spot.id}
                                position={spot.pos as [number, number]}
                                icon={icon}
                            >
                                <Popup className="custom-popup" maxWidth={300}>
                                    <div className="p-3">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">
                                                    {spot.category}
                                                </span>
                                                <h3 className="font-black uppercase italic text-lg leading-none">{spot.name}</h3>
                                            </div>
                                            <div className={`p-2 rounded-lg ${isShop ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {isShop ? <ShoppingBag size={18} /> : <MapPin size={18} />}
                                            </div>
                                        </div>

                                        {spot.description && (
                                            <div
                                                className="text-[11px] text-muted-foreground mb-4 leading-relaxed line-clamp-4 overflow-hidden"
                                                dangerouslySetInnerHTML={{ __html: spot.description }}
                                            />
                                        )}

                                        <div className="flex gap-2">
                                            <button className="flex-grow py-2 bg-foreground text-background text-[11px] font-black uppercase italic rounded-xl flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-transform shadow-md">
                                                <Navigation size={12} />
                                                Go There
                                            </button>
                                            <button className="p-2 bg-muted text-muted-foreground rounded-xl border border-border hover:text-foreground transition-colors">
                                                <Info size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    <MapResizer />
                </MapContainer>

                <style jsx global>{`
          .leaflet-container {
            background: var(--background) !important;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 24px !important;
            padding: 0 !important;
            background: var(--background) !important;
            color: var(--foreground) !important;
            border: 2px solid var(--border) !important;
            box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.5) !important;
            backdrop-filter: blur(8px);
          }
          .custom-popup .leaflet-popup-content {
            margin: 0 !important;
            width: 100% !important;
          }
          .custom-popup .leaflet-popup-tip {
            background: var(--background) !important;
            border: 2px solid var(--border) !important;
            border-top: none;
            border-left: none;
            box-shadow: none !important;
          }
          .custom-popup .leaflet-popup-close-button {
            padding: 8px !important;
            color: var(--muted-foreground) !important;
          }
          .leaflet-control-zoom {
            border: none !important;
            margin-left: 20px !important;
            margin-top: 20px !important;
          }
          .leaflet-control-zoom-in, .leaflet-control-zoom-out {
            background: var(--background) !important;
            color: var(--foreground) !important;
            border: 2px solid var(--border) !important;
            border-radius: 12px !important;
            width: 44px !important;
            height: 44px !important;
            line-height: 40px !important;
            font-size: 20px !important;
            margin-bottom: 4px !important;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
          }
          .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
            background: var(--muted) !important;
            color: var(--foreground) !important;
            border-color: var(--primary) !important;
          }
          
          /* Custom marker shadows and animations can go here if needed */
        `}</style>
            </div>
        </div>
    );
}
