export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { fetchLatestYoutubeVideos } from '@/lib/youtube';
import fs from 'fs';
import path from 'path';

const CRON_SECRET = process.env.CRON_SECRET || 'skatelife-secret';

export async function GET(request: Request) {
    if (process.env.GITHUB_ACTIONS === 'true') return NextResponse.json({ articles: [] });
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const videos = await fetchLatestYoutubeVideos();

        // Filter out existing videos
        const postsFilePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
        const existingPosts = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));
        const existingUrls = new Set(existingPosts.map((p: any) => p.content));

        const newVideos = videos.filter(v => !existingUrls.has(v.url));

        // Return structured for the dashboard
        const drafts = newVideos.map(v => ({
            title: v.title,
            description: `New video from ${v.channel}!`,
            content: v.url,
            type: 'video',
            tags: ['youtube', v.channel.toLowerCase().replace(/\s/g, '')],
            source: v.channel,
            date: new Date(v.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));

        return NextResponse.json({ articles: drafts });
    } catch (error) {
        console.error('YouTube fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}
