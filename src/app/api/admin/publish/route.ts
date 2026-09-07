import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { key } = await req.json();
        const secret = process.env.CRON_SECRET || 'skatelife-secret';

        if (key !== secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scriptPath = path.join(process.cwd(), 'PUBLISH_MANUAL.command');

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
