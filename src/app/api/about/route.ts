export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'src', 'data', 'translations.json');

export async function GET() {
    try {
        const data = fs.readFileSync(translationsPath, 'utf8');
        const translations = JSON.parse(data);

        return NextResponse.json({
            de: translations.de.about,
            en: translations.en.about
        });
    } catch (error) {
        console.error('Error reading translations:', error);
        return NextResponse.json({ error: 'Failed to load about content' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { about, key } = await request.json();

        // Verify secret key
        if (key !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Read current translations
        const data = fs.readFileSync(translationsPath, 'utf8');
        const translations = JSON.parse(data);

        // Update about sections
        if (about.de) {
            translations.de.about = about.de;
        }
        if (about.en) {
            translations.en.about = about.en;
        }

        // Write back to file
        fs.writeFileSync(translationsPath, JSON.stringify(translations, null, 2), 'utf8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating translations:', error);
        return NextResponse.json({ error: 'Failed to update about content' }, { status: 500 });
    }
}
