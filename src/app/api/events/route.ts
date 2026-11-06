import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving events:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
