import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { ADMIN_KEY, isAdminKey } from "@/lib/adminAuth";

export async function POST(req: Request) {
    try {
        const { key } = await req.json();

        if (!isAdminKey(key)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scriptPath = path.join(process.cwd(), 'Publish.command');

        const result = await new Promise((resolve) => {
            exec(`bash "${scriptPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    resolve({ error: error.message, stdout, stderr });
                    return;
                }
                resolve({ stdout, stderr });
            });
        });

        // @ts-ignore
        if (result.error && !result.stdout?.includes('ERFOLG')) {
            // @ts-ignore
            return NextResponse.json({ error: 'Publish failed', details: result }, { status: 500 });
        }

        return NextResponse.json({ message: 'Publish triggered', result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
