import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Prevent caching
// export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
        if (!fs.existsSync(filePath)) {
            // Return defaults if file doesn't exist
            return NextResponse.json({
                youtubeChannels: [],
                newsSources: [],
                instagramHashtags: []
            });
        }
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return NextResponse.json(JSON.parse(fileContents));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { settings, key } = body;

        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
