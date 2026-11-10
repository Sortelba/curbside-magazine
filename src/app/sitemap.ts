import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { SITE_URL } from "@/lib/site";

// Wird beim Build als /sitemap.xml erzeugt (auch für GitHub Pages)
export const dynamic = "force-static";

function readJson(file: string): any[] {
    try {
        return JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", file), "utf8"));
    } catch {
        return [];
    }
}

export default function sitemap(): MetadataRoute.Sitemap {
    const posts = readJson("posts.json");
    const dates = posts.map((p: any) => new Date(p.date)).filter((d: Date) => !isNaN(d.getTime()));
    const newest = dates.length ? new Date(Math.max(...dates.map((d: Date) => d.getTime()))) : new Date();

    const pages: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, lastModified: newest, changeFrequency: "daily", priority: 1 },
        { url: `${SITE_URL}/community/`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/learn/`, changeFrequency: "monthly", priority: 0.7 },
        { url: `${SITE_URL}/archive/`, lastModified: newest, changeFrequency: "daily", priority: 0.6 },
        { url: `${SITE_URL}/about/`, changeFrequency: "yearly", priority: 0.5 },
        { url: `${SITE_URL}/faq/`, changeFrequency: "yearly", priority: 0.4 },
        { url: `${SITE_URL}/skatemap/`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/impressum/`, changeFrequency: "yearly", priority: 0.1 },
        { url: `${SITE_URL}/datenschutz/`, changeFrequency: "yearly", priority: 0.1 },
        { url: `${SITE_URL}/agb/`, changeFrequency: "yearly", priority: 0.1 },
    ];

    // Ein Archiv-Eintrag pro Monat, mit dem Datum des neuesten Beitrags darin
    const months = new Map<string, Date>();
    for (const d of dates) {
        const slug = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!months.has(slug) || d > months.get(slug)!) months.set(slug, d);
    }
    for (const [slug, last] of [...months].sort().reverse()) {
        pages.push({ url: `${SITE_URL}/archive/${slug}/`, lastModified: last, changeFrequency: "weekly", priority: 0.5 });
    }
    // Eigene Seite pro Beitrag
    for (const p of posts) {
        const d = new Date(p.date);
        if (!p.id || isNaN(d.getTime())) continue;
        pages.push({ url: `${SITE_URL}/news/${p.id}/`, lastModified: d, changeFrequency: "monthly", priority: 0.6 });
    }
    return pages;
}
