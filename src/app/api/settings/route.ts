import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

// Force dynamic rendering so env vars work at runtime
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (process.env.GITHUB_ACTIONS === 'true') return NextResponse.json({});
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
        const loadedSettings = JSON.parse(fileContents);
        // Merge with defaults to ensure all keys exist
        const defaultSettings = {
            youtubeChannels: [],
            newsSources: [],
            instagramHashtags: [],
            showLearnCenter: false
        };
        return NextResponse.json({ ...defaultSettings, ...loadedSettings });
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

        // Read existing settings to prevent data loss
        let currentSettings = {};
        if (fs.existsSync(filePath)) {
            try {
                currentSettings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                console.error("Failed to read existing settings for merge", e);
            }
        }

        // Merge incoming settings with current (incoming wins)
        const finalSettings = { ...currentSettings, ...settings };

        fs.writeFileSync(filePath, JSON.stringify(finalSettings, null, 2));

        // Invalidate homepage cache
        revalidatePath('/');

        return NextResponse.json({ success: true, settings: finalSettings });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
