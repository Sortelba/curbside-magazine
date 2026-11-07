import * as cheerio from "cheerio";

/** Holt den Fließtext eines Artikels (für das nachträgliche Umschreiben alter Posts). */
export async function fetchArticleText(url?: string): Promise<string> {
    if (!url || /instagram\.com|youtube\.com|youtu\.be/.test(url)) return "";
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" },
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) return "";
        const $ = cheerio.load(await res.text());
        $("script,style,nav,footer,header,aside,.related,.comments,.sidebar").remove();
        const root = $("article, .entry-content, .post-content, main").first();
        return (root.length ? root : $("body"))
            .find("p,h2,h3")
            .map((_, el) => $(el).text().trim())
            .get()
            .filter((t) => t.length > 30)
            .join("\n\n")
            .slice(0, 4000);
    } catch {
        return "";
    }
}
