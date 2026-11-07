import fs from "fs";
import path from "path";

// Gemeinsames Laden der Beiträge für Startseite, Beitragsseiten, Archiv und Sitemap
export function getAllPosts(): any[] {
    try {
        return JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", "posts.json"), "utf8"));
    } catch {
        return [];
    }
}

export function sortedPosts(): any[] {
    return getAllPosts()
        .filter((p: any) => p?.id && !isNaN(new Date(p.date).getTime()))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Kurztext ohne Zeilenumbrüche für Meta-Beschreibungen */
export function plainExcerpt(text: string, max = 160): string {
    const t = String(text || "").replace(/\s+/g, " ").replace(/\(Originalquelle:[^)]*\)/, "").trim();
    return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}
