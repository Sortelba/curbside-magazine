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

        // Execute the script
        // We pipe an empty string to it to satisfy the "read" prompt at the end
        const result = await new Promise((resolve, reject) => {
            exec(`echo "" | bash "${scriptPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    // We still resolve if it's just a git warning or something, 
                    // but we'll include the error info.
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
