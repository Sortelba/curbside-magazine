export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'learn.json');
const CRON_SECRET = process.env.CRON_SECRET || 'skatelife-secret';

export async function GET() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return NextResponse.json({ basics: [], coaches: [], randomizer: { beginner: [], intermediate: [], pro: [] }, channels: [] });
        }
        const fileContents = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading learn data:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Basic validation - ensure top level keys exist
        if (!data.basics || !data.coaches || !data.randomizer || !data.channels) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving learn data:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
