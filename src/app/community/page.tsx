import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Skateshops, Vereine & Projekte",
    description: "Unterstütze deine lokale Szene: Skatemap mit Spots, Skateparks und Shops, kleine Skateshops in ganz Deutschland, Skateboard-Vereine und soziale Skate-Projekte.",
    alternates: { canonical: "/community/" },
};

import fs from 'fs';
import path from 'path';
import CommunityContent from '@/components/CommunityContent';

function readJson(name: string, fallback: any) {
    const filePath = path.join(process.cwd(), 'src', 'data', name);
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export default async function CommunityPage() {
    const raw = readJson('community.json', { sections: [] });
    const map = readJson('map.json', { spots: [] });

    // Im Admin ausgeblendete Einträge gar nicht erst ausliefern
    const sections = (raw.sections || []).map((s: any) => ({
        ...s,
        items: (s.items || []).filter((i: any) => !i.hidden),
    }));

    // Skatemap: Spots/Parks aus map.json + alle sichtbaren Shops mit Position
    const shopPoints = (sections.find((s: any) => s.id === 'sec_shops')?.items || [])
        .filter((i: any) => typeof i.lat === 'number' && typeof i.lng === 'number')
        .map((i: any) => ({ id: i.id, name: i.name, type: 'shop', lat: i.lat, lng: i.lng, address: i.address, url: i.url }));
    const mapPoints = [...(map.spots || []).filter((p: any) => !p.hidden), ...shopPoints];

    return <CommunityContent data={{ sections, visibility: raw.visibility || {}, mapPoints }} />;
}
