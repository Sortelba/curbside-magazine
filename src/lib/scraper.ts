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
    mediaUrl?: string; // YouTube URL or Image URL
    text: string; // Full body text
    source: string;
}

function getNewsSources(): NewsSource[] {
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
async function scrapeDetail(url: string, selector: string): Promise<{ text: string; video?: string; image?: string }> {
    try {
        const response = await fetchWithHeaders(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const container = $(selector || 'article, .post-content, .entry-content, body');

        // Remove junk
        container.find('script, style, iframe:not([src*="youtube"]), .ad, .advertisement, nav, footer, header').remove();

        // Get text blocks to preserve some structure (Gemini likes paragraphs)
        const paragraphs = container.find('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
        const text = paragraphs || container.text().trim();

        // Look for YouTube iframe
        let video = container.find('iframe[src*="youtube"]').attr('src');
        if (!video) {
            video = $('iframe[src*="youtube"]').first().attr('src');
        }

        // Look for main image
        let image = container.find('img').first().attr('src');
        if (!image) {
            image = $('meta[property="og:image"]').attr('content');
        }
        if (!image) {
            // Filter out tracking pixels or icons
            image = $('img').filter((i, el) => {
                const src = $(el).attr('src') || '';
                return src.startsWith('http') && (src.includes('.jpg') || src.includes('.png') || src.includes('.webp') || src.includes('.jpeg'));
            }).first().attr('src');
        }

        // Final validation: ensure it's a full URL and not a generic page
        if (image && !image.match(/\.(jpg|jpeg|png|webp|gif|avif)($|\?|&)/i)) {
            image = undefined;
        }

        return { text, video, image };
    } catch (e) {
        console.error(`Failed to scrape detail: ${url}`, e);
        return { text: "" };
    }
}

// RSS Scraper
async function scrapeRssSource(source: NewsSource): Promise<ScrapedArticle[]> {
    try {
        console.log(`Fetching RSS for ${source.name}...`);
        const response = await fetchWithHeaders(source.url);
        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });

        const articles: ScrapedArticle[] = [];
        const items = $('item').slice(0, 3); // Get top 3 items

        items.each((i, el) => {
            const item = $(el);
            const title = item.find('title').text().trim();
            const url = item.find('link').text().trim();

            if (!url) return;

            // Content might be in content:encoded, description, or body
            const contentEncoded = item.find('content\\:encoded').text();
            let rawContent = contentEncoded || item.find('description').text();

            // Use cheerio to parse the HTML *inside* the RSS content/description to find images/text
            const $content = cheerio.load(rawContent);
            const text = $content.text().trim();
            const img = $content('img').attr('src');
            const video = $content('iframe[src*="youtube"]').attr('src');

            // Look for enclosure if no image found in content
            let mediaUrl = img;
            if (!mediaUrl) {
                const enclosure = item.find('enclosure[type^="image"]').attr('url');
                if (enclosure) mediaUrl = enclosure;
            }

            articles.push({
                title,
                url,
                mediaType: video ? 'video' : 'image',
                mediaUrl: video || mediaUrl,
                text: text.substring(0, 5000), // Limit text length
                source: source.name
            });
        });

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
        const html = await response.text();
        const $ = cheerio.load(html);

        const firstItem = $(source.selector).first();

        let title = firstItem.find('h1, h2, h3').first().text().trim();
        let url = firstItem.find('a').attr('href');

        if (!title || !url) {
            if (firstItem.is('a')) {
                url = firstItem.attr('href');
                title = firstItem.text().trim();
            }
        }

        if (!url) return [];

        if (!url.startsWith('http')) {
            const baseUrl = new URL(source.url).origin;
            url = new URL(url, baseUrl).toString();
        }

        const details = await scrapeDetail(url, 'article, .post-content, .entry-content, body');

        let mediaType: 'video' | 'image' | 'text' = 'text';
        let mediaUrl = details.image;

        if (details.video) {
            mediaType = 'video';
            mediaUrl = details.video;
        } else if (details.image) {
            mediaType = 'image';
        }

        return [{
            title,
            url,
            mediaType,
            mediaUrl,
            text: details.text || title,
            source: source.name
        }];

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
    const sources = getNewsSources();
    console.log(`Scraping ${sources.length} sources...`);

    const results = await Promise.all(sources.map(source => scrapeGenericSource(source)));

    // Check if results are null/empty and filter them out, then flatten
    return results.flat().filter(article => article !== null);
}
