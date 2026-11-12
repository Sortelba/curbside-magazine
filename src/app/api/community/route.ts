import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ADMIN_KEY, isAdminKey } from "@/lib/adminAuth";
import { queueMapItems } from "@/lib/autoPosts.mjs";

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'community.json');
const SETTINGS_FILE = path.join(process.cwd(), 'src', 'data', 'settings.json');

/** Neue Skateshops mit Adresse, aber ohne Position: Koordinaten über OpenStreetMap suchen (für Skatemap + Auto-Post) */
async function geocodeNewShops(before: any, data: any) {
    // Das Dashboard kennt nachträglich gefundene Koordinaten nicht → beim Speichern behalten
    const oldById = new Map((before?.sections?.find((s: any) => s.id === 'sec_shops')?.items || []).map((i: any) => [i.id, i]));
    for (const shop of data.sections.find((s: any) => s.id === 'sec_shops')?.items || []) {
        const old: any = oldById.get(shop.id);
        if (old && typeof shop.lat !== 'number' && typeof old.lat === 'number' && String(old.address || '') === String(shop.address || '')) {
            shop.lat = old.lat; shop.lng = old.lng;
        }
    }
    const oldIds = new Set((before?.sections?.find((s: any) => s.id === 'sec_shops')?.items || []).map((i: any) => i.id));
    const todo = (data.sections.find((s: any) => s.id === 'sec_shops')?.items || [])
        .filter((i: any) => !oldIds.has(i.id) && typeof i.lat !== 'number' && String(i.address || '').trim() && !/online/i.test(i.address))
        .slice(0, 5);
    for (const [n, shop] of todo.entries()) {
        if (n) await new Promise((r) => setTimeout(r, 1100)); // höchstens 1 Anfrage pro Sekunde
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(shop.address)}`, {
                headers: { 'User-Agent': 'CurbsideMagazine/1.0 (curbside.sortelba.com)' }, signal: AbortSignal.timeout(10000),
            });
            const [hit] = await res.json();
            if (hit) { shop.lat = Number(Number(hit.lat).toFixed(5)); shop.lng = Number(Number(hit.lon).toFixed(5)); }
        } catch { /* ohne Position: kommt später über scripts/geocode-shops.mjs */ }
    }
}

export async function GET() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Return default structure if file doesn't exist
            return NextResponse.json({ sections: [] });
        }
        const fileContents = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading community data:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!ADMIN_KEY || authHeader !== `Bearer ${ADMIN_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Basic validation
        if (!data.sections || !Array.isArray(data.sections)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const before = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : { sections: [] };
        await geocodeNewShops(before, data);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        // Skateshops mit Position erscheinen auf der Skatemap → neuer Shop = Vorschlag für einen Beitrag (Admin → Auto-Posts)
        let autoPosts = 0;
        try {
            const shops = (d: any) => d?.sections?.find((s: any) => s.id === 'sec_shops')?.items || [];
            const hasPos = (i: any) => typeof i?.lat === 'number' && typeof i?.lng === 'number';
            const oldWithPos = new Set(shops(before).filter(hasPos).map((i: any) => i.id));
            const added = shops(data).filter((i: any) => hasPos(i) && !oldWithPos.has(i.id) && !i.hidden);
            if (added.length) {
                autoPosts = queueMapItems(added.map((i: any) => ({
                    name: i.name, type: 'shop', lat: i.lat, lng: i.lng, address: i.address, hours: i.hours, url: i.url,
                    ref: `shop:${i.id}`,
                })), 'Skateshops');
            }
        } catch (e) {
            console.error('Auto-Posts für Skateshops fehlgeschlagen:', e);
        }

        // "Community anzeigen" (Einstellungen) folgt den Bereichen: ist mindestens
        // ein Bereich sichtbar, wird die Community gezeigt, sonst ausgeblendet.
        const SECTIONS = ['sec_clubs', 'sec_projects', 'sec_learn']; // Skateshops gehören zur Skatemap
        const anyVisible = SECTIONS.some(id => data.visibility?.[id] !== false);
        try {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
            if (settings.showCommunity !== anyVisible) {
                settings.showCommunity = anyVisible;
                fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
            }
        } catch (e) {
            console.error('Could not sync showCommunity:', e);
        }

        return NextResponse.json({ success: true, autoPosts });
    } catch (error) {
        console.error('Error saving community data:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
