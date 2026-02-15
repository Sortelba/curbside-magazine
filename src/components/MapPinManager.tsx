"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2, Loader2, AlertCircle } from "lucide-react";

// Custom icons similar to LeafletMap.tsx
const createIcon = (color: string) => {
    return new L.DivIcon({
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
        className: "custom-div-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

const icons = {
    Street: createIcon("#10b981"),
    Park: createIcon("#3b82f6"),
    Shop: createIcon("#f59e0b"),
    Delete: createIcon("#ef4444"),
};

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 500);
    }, [map]);
    return null;
}

export default function MapPinManager({ keyStr }: { keyStr: string }) {
    const [spots, setSpots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchSpots = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/map/all?key=${keyStr}`);
            const data = await res.json();
            setSpots(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpots();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Möchtest du den Spot "${name}" wirklich unwiderruflich löschen?`)) return;

        setDeletingId(id);
        try {
            const res = await fetch("/api/map/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, key: keyStr }),
            });

            if (res.ok) {
                setSpots(spots.filter(s => s.id !== id));
            } else {
                alert("Fehler beim Löschen.");
            }
        } catch (e) {
            console.error(e);
            alert("Netzwerkfehler.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return (
        <div className="h-[500px] flex items-center justify-center bg-muted/10 rounded-3xl border-2 border-dashed border-border">
            <Loader2 className="animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-card border-2 border-border rounded-3xl overflow-hidden relative shadow-lg">
                <div className="absolute top-4 left-4 z-[1000] space-y-2">
                    <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border flex items-center gap-2 shadow-sm">
                        <AlertCircle size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pin anklicken zum Löschen</span>
                    </div>
                </div>

                <div className="h-[600px] w-full">
                    <MapContainer
                        center={[48.7758, 9.1829]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapResizer />
                        {spots.map((spot) => (
                            <Marker
                                key={spot.id}
                                position={spot.pos}
                                icon={deletingId === spot.id ? icons.Delete : icons[spot.category as keyof typeof icons] || icons.Street}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-2 space-y-3 min-w-[150px]">
                                        <h3 className="text-sm font-black uppercase italic tracking-tighter leading-tight">{spot.name}</h3>
                                        <button
                                            onClick={() => handleDelete(spot.id, spot.name)}
                                            disabled={deletingId === spot.id}
                                            className="w-full py-2 bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            {deletingId === spot.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                            Pin Löschen
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            <div className="flex justify-center">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-muted/30 px-4 py-2 rounded-full">
                    {spots.length} Spots auf der Karte aktiv
                </p>
            </div>
        </div>
    );
}
