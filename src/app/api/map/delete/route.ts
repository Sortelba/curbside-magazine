export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, key } = body;

        const secretKey = process.env.CRON_SECRET || 'skatelife-secret';
        if (key !== secretKey) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!id) {
            return NextResponse.json({ message: "ID is required" }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'src/data/spots.json');
        const data = await fs.readFile(filePath, 'utf8');
        const spots = JSON.parse(data);

        const updatedSpots = spots.filter((spot: any) => spot.id !== id);

        if (spots.length === updatedSpots.length) {
            return NextResponse.json({ message: "Spot not found" }, { status: 404 });
        }

        await fs.writeFile(filePath, JSON.stringify(updatedSpots, null, 2));

        return NextResponse.json({ message: "Spot deleted successfully" });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
