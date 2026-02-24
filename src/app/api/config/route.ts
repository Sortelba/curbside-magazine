import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Public config endpoint – returns only the flags the frontend needs,
 * without exposing sensitive settings (no auth key required).
 */
export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
        const defaults = { showCommunity: false, showLearnCenter: false };

        if (!fs.existsSync(filePath)) {
            return NextResponse.json(defaults);
        }

        const raw = fs.readFileSync(filePath, 'utf8');
        const settings = JSON.parse(raw);

        return NextResponse.json({
            showCommunity: settings.showCommunity ?? false,
            showLearnCenter: settings.showLearnCenter ?? false,
        });
    } catch {
        return NextResponse.json({ showCommunity: false, showLearnCenter: false });
    }
}
