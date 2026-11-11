import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAdminKey } from "@/lib/adminAuth";

// Postet einen bestehenden Beitrag erneut (zur Erinnerung): Datum auf heute,
// ganz nach oben. Inhalt und ID bleiben, das ursprüngliche Datum wird gemerkt.
export async function POST(request: Request) {
    try {
        const { id, key } = await request.json();
        if (!isAdminKey(key)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!id) return NextResponse.json({ error: 'Keine Post-ID' }, { status: 400 });

        const postsFilePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
        const posts = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));
        const index = posts.findIndex((p: any) => p.id === id);
        if (index === -1) return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 });

        const [post] = posts.splice(index, 1);
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const reposted = {
            ...post,
            originalDate: post.originalDate || post.date,
            date: today,
            repostedAt: new Date().toISOString(),
            status: 'published',
        };
        posts.unshift(reposted);
        fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
        return NextResponse.json({ success: true, post: reposted });
    } catch (error) {
        console.error('Repost failed:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
