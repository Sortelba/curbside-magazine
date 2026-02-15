import { fetch } from 'undici';
import fs from 'fs';

const channels = [
    { name: "Jason Skateham", handle: "@Jasonskateham" },
    { name: "Skate Paparazzi", handle: "@SkatePaparazzi" },
    { name: "Skate IQ", handle: "@Skateiq" },
    { name: "Koloss Skateboards", handle: "@kolossskateboards5855" },
    { name: "esskateboarding", handle: "@esskateboarding" },
    { name: "x Games", handle: "@XGames" },
    { name: "Dan Corrigan", handle: "@DanCorrigan" },
    { name: "santa Cruz Skateboarding", handle: "@SantaCruzSkateboards" },
    { name: "latte_alter", handle: "@latte_alter" },
    { name: "De Brecher", handle: "@de_brecher" },
    { name: "Habit TV", handle: "@habittv7758" },
    { name: "TomCat Skateboards", handle: "@TomCatSkateboarding" },
    { name: "RedLuk", handle: "@RedLuk" },
    { name: "Freeling Kim", handle: "@FreelingSkateboard" },
    // Already known or problematic
    // { name: "Webz", id: "UCke7CUOPnzp1dYwI0keZYmQ" }, 
    // { name: "RedBull Skateboarding", id: "UC_0R4YgI6a_42lXk0CRo1EA" }
];

async function getChannelId(handle: string) {
    try {
        const url = `https://www.youtube.com/${handle}`;
        const res = await fetch(url);
        const html = await res.text();

        // Look for channelId in meta tags or JSON
        // Common pattern: "channelId":"UC..."
        const match = html.match(/"channelId":"(UC[\w-]{22})"/);
        if (match) return match[1];

        // Fallback: RSS link
        const rssMatch = html.match(/channel_id=(UC[\w-]{22})/);
        if (rssMatch) return rssMatch[1];

        return null;
    } catch (e: any) {
        console.error(`Error fetching ${handle}:`, e.message);
        return null;
    }
}

async function main() {
    console.log("Fetching IDs...");
    const results = [];

    // Add known ones
    results.push({ name: "Webz", id: "UCke7CUOPnzp1dYwI0keZYmQ" });
    results.push({ name: "RedBull Skateboarding", id: "UC_0R4YgI6a_42lXk0CRo1EA" });

    for (const channel of channels) {
        const id = await getChannelId(channel.handle);
        if (id) {
            console.log(`✅ ${channel.name}: ${id}`);
            results.push({ name: channel.name, id });
        } else {
            console.log(`❌ ${channel.name}: Not found`);
        }
    }

    console.log("\nJSON Result:");
    console.log(JSON.stringify(results, null, 2));
}

main();
