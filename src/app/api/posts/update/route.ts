export const dynamic = 'force-static';
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

        if (!post || !post.id) {
            return NextResponse.json({ error: 'Invalid post data' }, { status: 400 });
        }

        const postsFilePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
        const existingPosts = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));

        const postIndex = existingPosts.findIndex((p: any) => p.id === post.id);

        if (postIndex === -1) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Update the post
        existingPosts[postIndex] = { ...existingPosts[postIndex], ...post };

        fs.writeFileSync(postsFilePath, JSON.stringify(existingPosts, null, 2));

        return NextResponse.json({ success: true, message: 'Post updated successfully.' });

    } catch (error) {
        console.error('Update post failed:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
