import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Skateshops, Vereine & Projekte",
    description: "Unterstütze deine lokale Szene: kleine Skateshops in ganz Deutschland mit Adresse und Öffnungszeiten, Skateboard-Vereine und soziale Skate-Projekte.",
    alternates: { canonical: "/community/" },
};

import fs from 'fs';
import path from 'path';
import CommunityContent from '@/components/CommunityContent';

// Force dynamic rendering
// export const dynamic = 'force-dynamic';

async function getCommunityData() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'community.json');
    if (!fs.existsSync(filePath)) {
        return { sections: [] };
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
}

export default async function CommunityPage() {
    const data = await getCommunityData();
    return <CommunityContent data={data} />;
}
