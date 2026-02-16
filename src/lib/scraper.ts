import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { Agent, fetch } from 'undici';
import { fetchLatestYoutubeVideos } from './youtube';
import { searchInstagramHashtag } from './instagram';

// Create an agent that ignores SSL errors for Boardstation etc.
const dispatcher = new Agent({
    connect: {
        rejectUnauthorized: false
    }
});

export interface NewsSource {
    name: string;
    url: string;
    selector: string; // CSS selector for HTML, or 'item' for RSS/XML (unused for RSS but kept for schema)
    type?: 'rss' | 'html';
}

export interface ScrapedArticle {
    title: string;
    url: string;
    mediaType: 'video' | 'image' | 'text';
    mediaUrl?: string; // Main image or video URL
    text: string; // Full body text
    source: string;
    media?: {
        images?: string[];
        videoUrl?: string;
    };
}

async function getNewsSources(): Promise<NewsSource[]> {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
        if (fs.existsSync(filePath)) {
            const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return settings.newsSources || [];
        }
    } catch (e) {
        console.error("Error reading settings.json", e);
    }
    return [];
}

async function getInstagramHashtags(): Promise<string[]> {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
        if (fs.existsSync(filePath)) {
            const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return settings.instagramHashtags || [];
        }
    } catch (e) {
        console.error("Error reading settings.json", e);
    }
    return [];
}

async function fetchWithHeaders(url: string) {
    return fetch(url, {
        dispatcher,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,de;q=0.8'
        }
    });
}

// Extract content from HTML Detail Page
async function scrapeDetail(url: string, selector: string): Promise<{ text: string; video?: string; image?: string; images: string[] }> {
    try {
        const response = await fetchWithHeaders(url);
        if (!response.ok) {
            console.warn(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
            return { text: "", images: [] };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // More comprehensive set of possible content containers
        const contentSelectors = [
            selector,
            'article',
            '.post-content',
            '.entry-content',
            '.td-post-content',
            '.elementor-widget-container',
            '.main-content',
            'main'
        ].filter(Boolean).join(', ');

        const container = $(contentSelectors).first();
        if (container.length === 0) {
            return { text: "", images: [] };
        }

        // Remove junk
        container.find('script, style, iframe:not([src*="youtube"]), .ad, .advertisement, nav, footer, header, .related, .comments, .sidebar, .wp-caption-text').remove();

        // Get text blocks to preserve some structure (Gemini likes paragraphs)
        const paragraphs = container.find('p, h1, h2, h3, h4').map((i, el) => $(el).text().trim()).get().filter(t => t.length > 20).join('\n\n');
        const text = paragraphs || container.text().trim();

        // Look for YouTube iframe
        let video = container.find('iframe[src*="youtube"]').attr('src');
        if (!video) {
            video = $('iframe[src*="youtube"]').first().attr('src');
        }

        // --- Improved Image Recognition ---
        // 1. Prioritize OpenGraph and Twitter meta tags for the main image
        let mainImage = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('meta[property="og:image:url"]').attr('content') ||
            $('link[rel="image_src"]').attr('href');

        // 2. Collect all images from the article body or specific post thumbnails
        const images: string[] = [];
        container.find('img').each((i, el) => {
            const src = $(el).attr('src') ||
                $(el).attr('data-src') ||
                $(el).attr('data-lazy-src') ||
                $(el).attr('data-srcset')?.split(' ')[0];

            if (src && (src.startsWith('http') || src.startsWith('/'))) {
                // Filter out small icons or tracking pixels or avatars
                const isLikelyImage = src.match(/\.(jpg|jpeg|png|webp|avif)($|\?|&)/i) || src.includes('wp-content/uploads');
                const isTooSmall = src.includes('avatar') || src.includes('150x150') || src.includes('icon');

                if (isLikelyImage && !isTooSmall && !images.includes(src)) {
                    images.push(src);
                }
            }
        });

        // 3. If no main image from meta tags, pick the first body image
        if (!mainImage && images.length > 0) {
            mainImage = images[0];
        }

        // Ensure mainImage is in the images array
        if (mainImage && !images.includes(mainImage)) {
            images.unshift(mainImage);
        }

        // Make URLs absolute
        const baseUrl = new URL(url).origin;
        const finalizedImages = images.map(img => {
            if (img.startsWith('//')) return `https:${img}`;
            if (img.startsWith('/')) return `${baseUrl}${img}`;
            return img;
        });

        let finalMainImage = mainImage;
        if (finalMainImage) {
            if (finalMainImage.startsWith('//')) finalMainImage = `https:${finalMainImage}`;
            else if (finalMainImage.startsWith('/')) finalMainImage = `${baseUrl}${finalMainImage}`;
        }

        return {
            text,
            video,
            image: finalMainImage,
            images: finalizedImages.slice(0, 10).filter(img => img.startsWith('http'))
        };
    } catch (e) {
        console.error(`Failed to scrape detail: ${url}`, e);
        return { text: "", images: [] };
    }
}

// Helper function to clean article titles
function cleanTitle(title: string): string {
    // Remove common prefixes like [News], [Video], etc.
    return title
        .replace(/^\[News\]\s*/i, '')
        .replace(/^\[Video\]\s*/i, '')
        .replace(/^\[Article\]\s*/i, '')
        .replace(/^\[Update\]\s*/i, '')
        .replace(/^News:\s*/i, '')
        .replace(/^Video:\s*/i, '')
        .trim();
}

// RSS Scraper
async function scrapeRssSource(source: NewsSource): Promise<ScrapedArticle[]> {
    try {
        console.log(`Fetching RSS for ${source.name}...`);
        const response = await fetchWithHeaders(source.url);

        if (!response.ok) {
            console.warn(`RSS fetch failed for ${source.name}: ${response.status}`);
            return [];
        }

        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });

        const items = $('item').slice(0, 5); // Scrape fewer items per source for better speed
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 7); // Increased window slightly

        // Parallel detail scraping
        const articlePromises = items.toArray().map(async (el) => {
            const item = $(el);
            const title = cleanTitle(item.find('title').text().trim());
            const url = item.find('link').text().trim();
            const pubDateStr = item.find('pubDate').text().trim();

            if (!url) return null;

            if (pubDateStr) {
                const pubDate = new Date(pubDateStr);
                if (!isNaN(pubDate.getTime()) && pubDate < fourDaysAgo) return null;
            }

            const details = await scrapeDetail(url, 'article, .post-content, .entry-content, body');
            if (!details.text || details.text.length < 100) return null;

            const video = details.video;
            const images = details.images;
            const mainImage = details.image;

            return {
                title,
                url,
                mediaType: video ? 'video' : 'image',
                mediaUrl: video || mainImage,
                text: details.text || title,
                source: source.name,
                media: {
                    images: images,
                    videoUrl: video
                }
            } as ScrapedArticle;
        });

        const results = await Promise.all(articlePromises);
        return results.filter((a): a is ScrapedArticle => a !== null);

    } catch (e) {
        console.error(`Error scraping RSS ${source.name}:`, e);
        return [];
    }
}

// HTML Scraper
async function scrapeHtmlSource(source: NewsSource): Promise<ScrapedArticle[]> {
    try {
        console.log(`Fetching HTML for ${source.name}...`);
        const response = await fetchWithHeaders(source.url);

        if (!response.ok) {
            console.warn(`HTML fetch failed for ${source.name}: ${response.status}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const items = $(source.selector).slice(0, 5);

        // Parallel detail scraping
        const articlePromises = items.toArray().map(async (el) => {
            const item = $(el);
            let title = cleanTitle(item.find('h1, h2, h3, h4').first().text().trim());
            let url = item.find('a').attr('href');

            if (!title || !url) {
                if (item.is('a')) {
                    url = item.attr('href');
                    title = cleanTitle(item.text().trim());
                }
            }

            if (!url) return null;
            if (!url.startsWith('http')) {
                const baseUrl = new URL(source.url).origin;
                url = new URL(url, baseUrl).toString();
            }

            const details = await scrapeDetail(url, 'article, .post-content, .entry-content, body');
            if (!details.text || details.text.length < 100) return null;

            const mediaUrl = details.video || details.image;
            const mediaType: 'video' | 'image' | 'text' = details.video ? 'video' : (details.image ? 'image' : 'text');

            return {
                title,
                url,
                mediaType,
                mediaUrl,
                text: details.text || title,
                source: source.name,
                media: {
                    images: details.images,
                    videoUrl: details.video
                }
            } as ScrapedArticle;
        });

        const results = await Promise.all(articlePromises);
        return results.filter((a): a is ScrapedArticle => a !== null);

    } catch (error) {
        console.error(`Error scraping HTML ${source.name}:`, error);
        return [];
    }
}

export async function scrapeGenericSource(source: NewsSource): Promise<ScrapedArticle[]> {
    if (source.type === 'rss') {
        return scrapeRssSource(source);
    }
    return scrapeHtmlSource(source);
}

export async function scrapeAllSources(): Promise<ScrapedArticle[]> {
    const sources = await getNewsSources();
    const instaTags = await getInstagramHashtags();

    console.log(`Scraping ${sources.length} news sources, YouTube, and ${instaTags.length} Instagram tags...`);

    // 1. News Sources (Parallel per source, and parallel within source)
    const newsResults = await Promise.all(sources.map((source: NewsSource) => scrapeGenericSource(source)));

    // 2. YouTube Videos
    let youtubeArticles: ScrapedArticle[] = [];
    try {
        const videos = await fetchLatestYoutubeVideos();
        youtubeArticles = videos.map(v => ({
            title: v.title,
            url: v.url || `https://www.youtube.com/watch?v=${v.videoId}`,
            mediaType: 'video' as const,
            mediaUrl: `https://www.youtube.com/embed/${v.videoId}`,
            text: `Neues Video von ${v.channel} auf YouTube!`,
            source: v.channel,
            media: {
                videoUrl: `https://www.youtube.com/embed/${v.videoId}`,
                images: [v.thumbnail]
            }
        }));
    } catch (e) {
        console.error("YouTube scraping failed:", e);
    }

    // 3. Instagram Tags
    let instaArticles: ScrapedArticle[] = [];
    try {
        const instaResults = await Promise.all(instaTags.map(tag => searchInstagramHashtag(tag)));
        instaArticles = instaResults.flat().map(p => ({
            title: `Insta Clip von ${p.author}`,
            url: p.url,
            mediaType: p.type as 'video' | 'image',
            mediaUrl: p.url,
            text: p.caption || "Instagram Post",
            source: "Instagram",
            media: {
                images: p.thumbnail ? [p.thumbnail] : [],
                videoUrl: p.type === 'video' ? p.url : ""
            }
        }));
    } catch (e) {
        console.error("Instagram scraping failed:", e);
    }

    const allArticles = [...newsResults.flat(), ...youtubeArticles, ...instaArticles];

    // Filter and unique check
    return allArticles.filter((article: ScrapedArticle) => article !== null);
}
