import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { post, key } = body;

        // Security check
        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!post || !post.title || !post.content) {
            return NextResponse.json({ error: 'Invalid post data' }, { status: 400 });
        }

        const postsFilePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
        const existingPosts = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));

        // Append new post to the top
        const updatedPosts = [post, ...existingPosts];
        fs.writeFileSync(postsFilePath, JSON.stringify(updatedPosts, null, 2));

        return NextResponse.json({ success: true, message: 'Post saved successfully.' });

    } catch (error) {
        console.error('Save post failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
