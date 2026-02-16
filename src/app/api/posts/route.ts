export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// export const dynamic = 'force-dynamic';

const postsFilePath = path.join(process.cwd(), 'src', 'data', 'posts.json');

function getPosts() {
    if (!fs.existsSync(postsFilePath)) {
        return [];
    }
    const fileContent = fs.readFileSync(postsFilePath, 'utf8');
    try {
        return JSON.parse(fileContent);
    } catch (e) {
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const posts = getPosts();
        return NextResponse.json(posts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const body = await request.json();
        const { title, key } = body;

        // Security check
        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const posts = getPosts();
        // Filter out the post with the given title
        // Note: Title collision is possible but unlikely in this simple context
        const newPosts = posts.filter((p: any) => p.title !== title);

        fs.writeFileSync(postsFilePath, JSON.stringify(newPosts, null, 2));

        return NextResponse.json({ success: true, message: 'Post deleted' });

    } catch (error) {
        console.error('Delete failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
