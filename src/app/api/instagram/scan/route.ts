export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { searchInstagramHashtag } from '@/lib/instagram';

// export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (process.env.GITHUB_ACTIONS === 'true') return NextResponse.json({ articles: [] });
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const hashtag = searchParams.get('hashtag');

    if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hashtag) {
        return NextResponse.json({ error: 'Hashtag is required' }, { status: 400 });
    }

    try {
        const posts = await searchInstagramHashtag(hashtag);

        // Sort by weight
        const topPosts = posts.sort((a, b) => b.weight - a.weight).slice(0, 3);

        if (topPosts.length === 0) {
            return NextResponse.json({ message: 'No posts found.' });
        }

        // Create a single "Article" draft
        const article = {
            title: `Top 3 Insta Bangers: #${hashtag}`,
            description: `Die besten Clips der Woche aus der Community für #${hashtag}. Checkt die Moves!`,
            type: 'instagram-mix',
            content: JSON.stringify(topPosts.map(p => ({
                url: p.url,
                author: p.author,
                authorUrl: p.authorUrl
            }))),
            tags: [hashtag, 'instagram', 'top3', 'bangers'],
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'draft'
        };

        return NextResponse.json({ articles: [article] });

    } catch (error) {
        console.error('Instagram scan failed:', error);
        return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
    }
}
