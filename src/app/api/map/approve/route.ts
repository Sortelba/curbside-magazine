export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, key, action, updatedSpot } = body;

        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const pendingPath = path.join(process.cwd(), 'src/data/pending_spots.json');
        const livePath = path.join(process.cwd(), 'src/data/spots.json');

        const pendingData = await fs.readFile(pendingPath, 'utf8');
        let pendingSpots = JSON.parse(pendingData);

        const spotToHandle = pendingSpots.find((s: any) => s.id === id);

        if (!spotToHandle) {
            return NextResponse.json({ message: "Spot not found" }, { status: 404 });
        }

        if (action === 'approve') {
            const liveData = await fs.readFile(livePath, 'utf8');
            const liveSpots = JSON.parse(liveData);

            // Use updated spot data if provided (admin edits)
            const finalSpot = updatedSpot || spotToHandle;

            // Generate a proper ID for the live map
            const newId = `spot_${Date.now()}`;

            // Format for spots.json
            // Expected format (from spots.json): { id, name, description, category, pos: [lat, lon] }

            // Parse coordinates from location string if it looks like lat,lon
            let pos = [48.7758, 9.1829]; // Default Stuttgart
            if (finalSpot.location.includes(',')) {
                const parts = finalSpot.location.split(',').map((s: string) => parseFloat(s.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    pos = parts;
                }
            }

            // Description logic: combine user text with media links if present
            let description = finalSpot.description || '';
            if (finalSpot.mediaUrl) description += `<br/><img src="${finalSpot.mediaUrl}" />`;
            if (finalSpot.youtubeUrl) description += `<br/><a href="${finalSpot.youtubeUrl}">Video</a>`;

            const formattedSpot = {
                id: newId,
                name: finalSpot.name,
                description: description,
                category: finalSpot.category.charAt(0).toUpperCase() + finalSpot.category.slice(1),
                pos: pos,
                createdAt: new Date().toISOString()
            };

            liveSpots.push(formattedSpot);
            await fs.writeFile(livePath, JSON.stringify(liveSpots, null, 2));
        }

        // Remove from pending (for both approve and reject)
        pendingSpots = pendingSpots.filter((s: any) => s.id !== id);
        await fs.writeFile(pendingPath, JSON.stringify(pendingSpots, null, 2));

        return NextResponse.json({ message: `Spot ${action}ed successfully` });
    } catch (error) {
        console.error("Approve error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
