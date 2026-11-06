import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findDuplicate } from '@/lib/dedupe';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { post, key, force } = body;

        // Security check
        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!post || !post.title || !post.content) {
            return NextResponse.json({ error: 'Invalid post data' }, { status: 400 });
        }

        const postsFilePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
        const existingPosts = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));

        // Keine doppelten Beiträge (außer ausdrücklich erzwungen)
        const duplicate = force ? null : findDuplicate(post, existingPosts);
        if (duplicate) {
            return NextResponse.json(
                { error: 'duplicate', message: 'Beitrag ist schon vorhanden.', duplicateOf: duplicate.title },
                { status: 409 }
            );
        }

        // Append new post to the top
        const updatedPosts = [post, ...existingPosts];
        fs.writeFileSync(postsFilePath, JSON.stringify(updatedPosts, null, 2));

        return NextResponse.json({ success: true, message: 'Post saved successfully.' });

    } catch (error) {
        console.error('Save post failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
