import { NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/scraper';
import { rewriteNews } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

// Prevent vercel/next from caching this route
// export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        // Simple security check (optional, but good practice)
        if (key !== process.env.CRON_SECRET && key !== 'skatelife-secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting scrape job...');

        // 1. Scrape all sources from settings
        const results = await scrapeAllSources();
        // Remove nulls and flatten is already done in scrapeAllSources, but ensuring it's an array
        const articles = results.filter(a => a !== null);

        if (articles.length === 0) {
            return NextResponse.json({ message: 'No new articles found.' });
        }

        // 2. Rewrite content using Gemini
        const postsFilePath = path.join(process.cwd(), 'src', 'data', 'posts.json');

        // Handle case where posts.json might not exist yet
        let existingPosts = [];
        if (fs.existsSync(postsFilePath)) {
            existingPosts = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));
        }

        // We only want to add posts that aren't already there (check by Title or URL)
        const newPosts = [];

        for (const article of articles) {
            if (!article) continue;

            // Check if already scraped (by Title or URL)
            const exists = existingPosts.some(
                (p: any) => p.title === article.title || (p.originalUrl && p.originalUrl === article.url)
            );

            if (!exists) {
                // Validation: Skip if text is too short or looks like error/garbage
                if (!article.text || article.text.length < 100 || article.text.includes("JavaScript is required") || article.text.includes("Skip to content")) {
                    console.log(`Skipping invalid article: ${article.title}`);
                    continue;
                }

                // Rewrite with Gemini (now strictly bilingual)
                const rewritten = await rewriteNews({
                    title: article.title,
                    text: article.text,
                    source: article.source
                });

                // Generate Unique ID
                const uniqueId = `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                // Ensure we have both languages, fallback to original if missing
                const deTitle = rewritten.de?.title || rewritten.title || article.title;
                const deContent = rewritten.de?.content || rewritten.content || article.text.substring(0, 500);
                const enTitle = rewritten.en?.title || rewritten.title || article.title;
                const enContent = rewritten.en?.content || rewritten.content || article.text.substring(0, 500);

                // Construct Post Object with Multi-Media support
                const post = {
                    id: uniqueId,
                    title: deTitle, // Default to German for the main title field
                    description: deContent.substring(0, 200) + "...",
                    translations: {
                        de: {
                            title: deTitle,
                            content: deContent
                        },
                        en: {
                            title: enTitle,
                            content: enContent
                        }
                    },
                    type: article.mediaType,
                    content: article.mediaUrl || article.url, // Legacy fallback
                    media: {
                        images: article.media?.images || [],
                        videoUrl: article.media?.videoUrl || "",
                        externalLink: article.url
                    },
                    source: article.source,
                    originalUrl: article.url,
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    tags: rewritten.tags || [],
                    status: "published"
                };

                newPosts.push(post);
            }
        }

        // 3. Draft Mode: Return without saving
        const mode = searchParams.get('mode');
        if (mode === 'draft') {
            return NextResponse.json({ success: true, articles: newPosts });
        }

        // 4. Save to file (Default mode)
        if (newPosts.length > 0) {
            const updatedPosts = [...newPosts, ...existingPosts];
            fs.writeFileSync(postsFilePath, JSON.stringify(updatedPosts, null, 2));
            console.log(`Added ${newPosts.length} new posts.`);
            return NextResponse.json({ success: true, added: newPosts.length, posts: newPosts });
        }

        return NextResponse.json({ success: true, message: 'No new unique posts found.' });

    } catch (error) {
        console.error('Scrape job failed:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
