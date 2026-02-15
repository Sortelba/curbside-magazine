import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, contributor, category, location, description, mediaUrl, youtubeUrl } = body;

        if (!name || !location || !contributor) {
            return NextResponse.json({ message: "Name, contributor and location are required" }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'src/data/pending_spots.json');
        const data = await fs.readFile(filePath, 'utf8');
        const pendingSpots = JSON.parse(data);

        const newSubmission = {
            id: `pending_${Date.now()}`,
            name,
            contributor,
            category,
            location,
            description,
            mediaUrl,
            youtubeUrl,
            submittedAt: new Date().toISOString()
        };

        pendingSpots.push(newSubmission);
        await fs.writeFile(filePath, JSON.stringify(pendingSpots, null, 2));

        return NextResponse.json({ message: "Submission successful" });
    } catch (error) {
        console.error("Submission error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
