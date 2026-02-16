export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const CRON_SECRET = process.env.CRON_SECRET || 'skatelife-secret';
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Sanitize filename to prevent directory traversal keys
        const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${Date.now()}-${filename}`;

        if (!existsSync(UPLOAD_DIR)) {
            await mkdir(UPLOAD_DIR, { recursive: true });
        }

        const filepath = path.join(UPLOAD_DIR, uniqueFilename);
        await writeFile(filepath, buffer);

        return NextResponse.json({ url: `/uploads/${uniqueFilename}` });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
    }
}
