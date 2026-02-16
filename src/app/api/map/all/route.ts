export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
    if (process.env.GITHUB_ACTIONS === 'true') return NextResponse.json([]);
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        const secretKey = process.env.CRON_SECRET || 'skatelife-secret';
        if (key !== secretKey) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const filePath = path.join(process.cwd(), 'src/data/spots.json');
        const data = await fs.readFile(filePath, 'utf8');
        const spots = JSON.parse(data);

        return NextResponse.json(spots);
    } catch (error) {
        console.error('Fetch all spots error:', error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
