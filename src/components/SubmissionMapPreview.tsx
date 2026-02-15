"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const previewIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #f43f5e; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; items-center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><div style="transform: rotate(45deg); color: white; font-size: 10px;">🛹</div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
});

export default function SubmissionMapPreview({ location }: { location: string }) {
    // Parse coordinates from "lat, lng" format
    let pos: [number, number] | null = null;
    if (location.includes(',')) {
        const parts = location.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            pos = [parts[0], parts[1]];
        }
    }

    if (!pos) return (
        <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-black uppercase italic text-center p-4">
            Keine Koordinaten zum Anzeigen
        </div>
    );

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden border border-border">
            <MapContainer
                center={pos}
                zoom={14}
                zoomControl={false}
                dragging={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={pos} icon={previewIcon} />
            </MapContainer>
        </div>
    );
}
