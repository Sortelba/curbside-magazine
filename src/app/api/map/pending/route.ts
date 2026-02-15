import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const filePath = path.join(process.cwd(), 'src/data/pending_spots.json');
        const data = await fs.readFile(filePath, 'utf8');
        const pendingSpots = JSON.parse(data);
        return NextResponse.json(pendingSpots);
    } catch (error) {
        console.error("Fetch pending error:", error);
        return NextResponse.json({ message: "Error fetching data" }, { status: 500 });
    }
}
