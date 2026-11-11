import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Vereine & Projekte",
    description: "Unterstütze deine lokale Szene: Skateboard-Vereine und soziale Skate-Projekte. Skateshops findest du in der CURBSIDE Skatemap.",
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

    // Im Admin ausgeblendete Einträge gar nicht erst ausliefern
    const sections = (raw.sections || []).map((s: any) => ({
        ...s,
        items: (s.items || []).filter((i: any) => !i.hidden),
    }));

    return <CommunityContent data={{ sections, visibility: raw.visibility || {} }} />;
}
