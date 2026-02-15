import { fetch } from 'undici';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface YoutubeChannel {
    name: string;
    id: string;
}

function getChannels(): YoutubeChannel[] {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
        if (fs.existsSync(filePath)) {
            const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return settings.youtubeChannels || [];
        }
    } catch (e) {
        console.error("Error reading settings.json", e);
    }
    return [];
}

interface YoutubeVideo {
    channel: string;
    title: string;
    videoId: string;
    url: string | undefined;
    published: string;
    thumbnail: string;
}

export async function fetchLatestYoutubeVideos() {
    const videos: YoutubeVideo[] = [];

    const channels = getChannels();
    await Promise.all(channels.map(async (channel) => {
        try {
            const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
            const res = await fetch(rssUrl);
            const xml = await res.text();

            // simple regex parse to avoid heavyweight xml parser dependency if possible
            // or use cheerio with xml mode
            const $ = cheerio.load(xml, { xmlMode: true });

            const entry = $('entry').first();
            if (entry.length > 0) {
                const title = entry.find('title').text();
                const videoId = entry.find('yt\\:videoId').text();
                const published = entry.find('published').text();
                const link = entry.find('link').attr('href');

                // Check if recent? (Optional, but user said "always the newest")
                // We'll return the newest one.

                videos.push({
                    channel: channel.name,
                    title,
                    videoId,
                    url: link,
                    published,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                });
            }
        } catch (e) {
            console.error(`Error fetching RSS for ${channel.name}:`, e);
        }
    }));

    return videos;
}
