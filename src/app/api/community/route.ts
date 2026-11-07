import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ADMIN_KEY, isAdminKey } from "@/lib/adminAuth";

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'community.json');

export async function GET() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Return default structure if file doesn't exist
            return NextResponse.json({ sections: [] });
        }
        const fileContents = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading community data:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!ADMIN_KEY || authHeader !== `Bearer ${ADMIN_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Basic validation
        if (!data.sections || !Array.isArray(data.sections)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving community data:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
