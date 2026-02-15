"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import spotsData from "@/data/spots.json";

// Fix for default marker icon
const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; items-center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><div style="transform: rotate(45deg); color: white;">🛹</div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

// Icon for existing spots (subtle)
const existingSpotIcon = L.divIcon({
    className: 'existing-div-icon',
    html: `<div style="background-color: #94a3b8; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; items-center; justify-content: center; border: 2px solid white; opacity: 0.6;"><div style="transform: rotate(45deg); color: white; font-size: 10px;">📍</div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
});

interface MapPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialPos?: [number, number];
}

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    const [tempPos, setTempPos] = useState<[number, number] | null>(null);
    const map = useMapEvents({
        click(e) {
            setTempPos([e.latlng.lat, e.latlng.lng]);
        },
    });

    return tempPos ? (
        <Marker position={tempPos} icon={customIcon} zIndexOffset={1000}>
            <Popup closeButton={false}>
                <div className="p-2 text-center">
                    <p className="text-[10px] font-black uppercase italic mb-2">Position hier festlegen?</p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(tempPos[0], tempPos[1]);
                        }}
                        className="px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase italic rounded-lg hover:scale-105 transition-all"
                    >
                        Pin setzen
                    </button>
                </div>
            </Popup>
        </Marker>
    ) : null;
}

export default function MapPicker({ onLocationSelect, initialPos }: MapPickerProps) {
    const defaultPos: [number, number] = initialPos || [48.7758, 9.1829];

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden border border-border">
            <MapContainer
                center={defaultPos}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Existing Spots */}
                {(spotsData as any[]).map((spot: any) => (
                    <Marker
                        key={spot.id}
                        position={spot.pos as [number, number]}
                        icon={existingSpotIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <p className="text-[10px] font-black uppercase italic">{spot.name}</p>
                                <p className="text-[8px] text-muted-foreground uppercase">{spot.category}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <LocationMarker onSelect={onLocationSelect} />
            </MapContainer>
        </div>
    );
}
