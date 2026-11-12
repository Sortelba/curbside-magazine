import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ADMIN_KEY, isAdminKey } from "@/lib/adminAuth";
import { queueEvents } from "@/lib/autoPosts.mjs";

const eventsFilePath = path.join(process.cwd(), 'src', 'data', 'events.json');

export async function GET() {
    try {
        if (!fs.existsSync(eventsFilePath)) {
            return NextResponse.json([]);
        }
        const fileContent = fs.readFileSync(eventsFilePath, 'utf8');
        const events = JSON.parse(fileContent);
        return NextResponse.json(events);
    } catch (error) {
        console.error('Error reading events:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { events, key } = await request.json();

        // Security check
        if (!isAdminKey(key)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const before: any[] = fs.existsSync(eventsFilePath) ? JSON.parse(fs.readFileSync(eventsFilePath, 'utf8')) : [];
        fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));

        // Neue Events als Vorschläge für einen News-Beitrag merken (Admin → Auto-Posts)
        let autoPosts = 0;
        try {
            const oldIds = new Set(before.map((e: any) => e?.id));
            const added = (Array.isArray(events) ? events : []).filter((e: any) => e?.id && !oldIds.has(e.id));
            if (added.length) autoPosts = queueEvents(added);
        } catch (e) {
            console.error('Auto-Posts für Events fehlgeschlagen:', e);
        }
        return NextResponse.json({ success: true, autoPosts });
    } catch (error) {
        console.error('Error saving events:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
