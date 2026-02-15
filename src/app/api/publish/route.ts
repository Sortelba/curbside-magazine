import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log('--- PUBLISH API HIT ---');
    try {
        const body = await request.json();
        const { key } = body;
        console.log('Key received:', key ? 'YES' : 'NO');

        // Security check
        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Ensure git identity is set (fallback)
        try {
            await execPromise('git config user.name');
        } catch (e) {
            await execPromise('git config user.name "Curbside Admin"');
            await execPromise('git config user.email "admin@curbside.local"');
        }

        // 2. Git Add
        await execPromise('git add .');

        // 3. Git Commit
        try {
            await execPromise(`git commit -m "Update from Admin Dashboard: ${new Date().toISOString()}"`);
        } catch (e: any) {
            if (e.stdout?.includes('nothing to commit') || e.stderr?.includes('nothing to commit')) {
                // Try to push anyway in case there were unpushed commits
                await execPromise('git push origin main');
                return NextResponse.json({ message: 'No new changes, but checked for unpushed commits.' });
            }
            throw e;
        }

        // 4. Git Push
        await execPromise('git push origin main');

        return NextResponse.json({ success: true, message: 'Published successfully!' });

    } catch (error: any) {
        console.error('Publish failed:', error);
        return NextResponse.json({
            error: 'Publish failed.',
            details: error.message || String(error),
            stdout: error.stdout,
            stderr: error.stderr
        }, { status: 500 });
    }
}
