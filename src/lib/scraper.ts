import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { Agent, fetch } from 'undici';

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
        container.find('script, style, iframe:not([src*="youtube"]), .ad, .advertisement, nav, footer, header, .related, .comments, .sidebar').remove();

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
                // Filter out small icons or tracking pixels
                const isLikelyImage = src.match(/\.(jpg|jpeg|png|webp|gif|avif)($|\?|&)/i) || src.includes('wp-content/uploads');
                if (isLikelyImage && !images.includes(src)) {
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

        const articles: ScrapedArticle[] = [];
        const items = $('item').slice(0, 10); // Get top 10 items instead of 3

        // Calculate date threshold (4 days ago)
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

        console.log(`Found ${items.length} items in RSS feed for ${source.name}`);

        for (const el of items.toArray()) {
            const item = $(el);
            const title = cleanTitle(item.find('title').text().trim());
            const url = item.find('link').text().trim();
            const pubDateStr = item.find('pubDate').text().trim();

            if (!url) {
                console.log(`Skipping item without URL: ${title}`);
                continue;
            }

            // Parse and check publication date
            if (pubDateStr) {
                const pubDate = new Date(pubDateStr);
                if (!isNaN(pubDate.getTime()) && pubDate < fourDaysAgo) {
                    console.log(`Skipping old article from ${source.name}: ${title} (${pubDateStr})`);
                    continue;
                }
            }

            console.log(`Scraping detail for: ${title}`);

            // --- Deep Scraping: Always follow the link to get high-quality images and full text ---
            const details = await scrapeDetail(url, 'article, .post-content, .entry-content, body');

            const video = details.video;
            const images = details.images;
            const mainImage = details.image;

            if (!details.text || details.text.length < 100) {
                console.log(`Skipping article with insufficient text: ${title}`);
                continue;
            }

            articles.push({
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
            });

            console.log(`✓ Successfully scraped: ${title} from ${source.name}`);
        }

        console.log(`Completed ${source.name}: ${articles.length} articles found`);
        return articles;

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

        const articles: ScrapedArticle[] = [];
        const items = $(source.selector).slice(0, 10); // Get up to 10 items

        console.log(`Found ${items.length} items in HTML for ${source.name}`);

        for (const el of items.toArray()) {
            const item = $(el);

            let title = cleanTitle(item.find('h1, h2, h3, h4').first().text().trim());
            let url = item.find('a').attr('href');

            if (!title || !url) {
                if (item.is('a')) {
                    url = item.attr('href');
                    title = cleanTitle(item.text().trim());
                }
            }

            if (!url) {
                console.log(`Skipping HTML item without URL`);
                continue;
            }

            if (!url.startsWith('http')) {
                const baseUrl = new URL(source.url).origin;
                url = new URL(url, baseUrl).toString();
            }

            console.log(`Scraping HTML detail for: ${title}`);
            const details = await scrapeDetail(url, 'article, .post-content, .entry-content, body');

            if (!details.text || details.text.length < 100) {
                console.log(`Skipping HTML article with insufficient text: ${title}`);
                continue;
            }

            let mediaType: 'video' | 'image' | 'text' = 'text';
            const mediaUrl = details.video || details.image;

            if (details.video) {
                mediaType = 'video';
            } else if (details.image) {
                mediaType = 'image';
            }

            articles.push({
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
            });

            console.log(`✓ Successfully scraped HTML: ${title} from ${source.name}`);
        }

        console.log(`Completed HTML ${source.name}: ${articles.length} articles found`);
        return articles;

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
    console.log(`Scraping ${sources.length} sources...`);

    const results = await Promise.all(sources.map((source: NewsSource) => scrapeGenericSource(source)));

    // Check if results are null/empty and filter them out, then flatten
    return results.flat().filter((article: ScrapedArticle) => article !== null);
}
