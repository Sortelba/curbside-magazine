import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { scanSkateEvents } from '@/lib/eventScanner';
import { ADMIN_KEY, isAdminKey } from "@/lib/adminAuth";

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

const eventsFilePath = path.join(process.cwd(), 'src', 'data', 'events.json');

// Sucht europaweit nach kommenden Skate-Events und liefert Vorschläge zurück.
// Speichert nichts – übernommen wird im Admin-Kalender.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!isAdminKey(key)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const existing = fs.existsSync(eventsFilePath) ? JSON.parse(fs.readFileSync(eventsFilePath, 'utf8')) : [];
        // Zusätzliche Kalender-Seiten aus den Einstellungen (settings.json → eventSources)
        const settingsPath = path.join(process.cwd(), 'src', 'data', 'settings.json');
        const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, 'utf8')) : {};
        const extraPages = Array.isArray(settings.eventSources) ? settings.eventSources.filter((u: unknown) => typeof u === 'string') : [];

        const result = await scanSkateEvents(existing, {
            extraPages,
            today: searchParams.get('today') || undefined, // nur zum Testen
            international: searchParams.get('international') === '1',
        });
        return NextResponse.json(result);
    } catch (error) {
        console.error('Event scan failed:', error);
        return NextResponse.json({ error: 'Event-Scan fehlgeschlagen', details: String(error) }, { status: 500 });
    }
}
