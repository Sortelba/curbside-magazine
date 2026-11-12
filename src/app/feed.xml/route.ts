// RSS-Feed der News: /feed.xml (wird beim Build als Datei erzeugt, auch für GitHub Pages).
// Leser können ihn in einer Feed-App (Feedly, Inoreader, NetNewsWire …) abonnieren und
// werden dort benachrichtigt, sobald ein neuer Beitrag online ist.
import { sortedPosts, plainExcerpt } from "@/lib/posts";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";

const FEED_SIZE = 50;

const xml = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
const abs = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);
const mime = (url: string) => (/\.png($|\?)/i.test(url) ? "image/png" : /\.webp($|\?)/i.test(url) ? "image/webp" : /\.gif($|\?)/i.test(url) ? "image/gif" : "image/jpeg");

/** Zeitpunkt eines Beitrags: genaue Uhrzeit bei Auto-Posts, sonst das Datum */
function published(p: any): Date {
    const exact = p.auto?.created ? new Date(p.auto.created) : null;
    return exact && !isNaN(exact.getTime()) ? exact : new Date(p.date);
}

/** YouTube-ID aus watch-, embed-, youtu.be- oder shorts-Links */
function youtubeId(url: string): string | null {
    return String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1] || null;
}
const isUrl = (s: unknown) => /^(https?:\/\/|\/)/.test(String(s || "").trim());

/** Alles, was ein Feed-Eintrag braucht – so wie die Beitragsseite den Post zeigt */
function feedEntry(p: any) {
    const de = p.translations?.de;
    let title = String(de?.title || p.title || "").replace(/^\[News\]\s*/, "").trim();
    // Eigene Posts ohne Übersetzung (z. B. Pick of the Week): Untertitel steht in description, Text in content
    const ownText = !de && p.content && !isUrl(p.content) && p.type !== "instagram-mix" ? String(p.content).trim() : "";
    const subtitle = String(p.description || "").trim();
    // „Video der Woche:“ + Untertitel → „Video der Woche: "Ultra Violence" von john dilo“
    if (title.endsWith(":") && subtitle && !/^\[?News\]?/.test(subtitle)) title = `${title} ${subtitle}`;
    const text = de?.content || [title.includes(subtitle) ? "" : subtitle, ownText].filter(Boolean).join("\n\n");

    const videoUrl = String(p.media?.videoUrl || (p.type === "video" && isUrl(p.content) ? p.content : "") || "");
    const yt = youtubeId(videoUrl);
    const video = videoUrl
        ? yt
            ? { watch: `https://www.youtube.com/watch?v=${yt}`, embed: `https://www.youtube.com/embed/${yt}`, label: "YouTube", thumb: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` }
            : { watch: videoUrl, embed: "", label: /instagram\.com/.test(videoUrl) ? "Instagram" : "", thumb: "" }
        : null;

    // Insta-Mix: content ist eine Liste von Reels
    let clips: { url: string; author?: string }[] = [];
    if (p.type === "instagram-mix") {
        try { clips = (JSON.parse(p.content) || []).filter((c: any) => c?.url); } catch { /* keine Liste */ }
    }

    const rawImage = p.media?.images?.[0] || (p.type === "image" && isUrl(p.content) ? p.content : "") || video?.thumb || "";
    const image = rawImage ? abs(rawImage) : null;
    // Ein externer Link, der nicht schon das Video ist (z. B. Artikel bei Shredder News)
    const external = [p.originalUrl, p.media?.externalLink].find((u) => u && isUrl(u) && u !== videoUrl && !youtubeId(u)) || "";

    return { title, text, image, video, clips, external };
}

function itemHtml(p: any, e: ReturnType<typeof feedEntry>, link: string) {
    const paragraphs = String(e.text || "")
        .replace(/\(Originalquelle:[^)]*\)/, "")
        .split(/\n{2,}/)
        .filter((b) => b.trim())
        .map((block) => `<p>${xml(block.trim()).replace(/\n/g, "<br/>")}</p>`)
        .join("");
    const parts: string[] = [];
    if (p.category === "pick") parts.push(`<p><strong>⭐ Sortys Pick of the Week</strong></p>`);
    if (e.video?.embed) {
        // Eingebettetes Video (Inoreader, Feedly & Co. zeigen es direkt an) + Link als Rückfall
        parts.push(`<p><iframe width="560" height="315" src="${xml(e.video.embed)}" frameborder="0" allowfullscreen="allowfullscreen"></iframe></p>`);
        parts.push(`<p><a href="${xml(e.video.watch)}"><strong>▶ Video auf ${e.video.label} ansehen</strong></a></p>`);
        // Eigene Bilder des Beitrags (nicht das YouTube-Vorschaubild) zusätzlich zeigen
        if (e.image && e.image !== e.video.thumb) parts.push(`<p><img src="${xml(e.image)}" alt="${xml(e.title)}"/></p>`);
    } else {
        if (e.image) parts.push(e.video ? `<p><a href="${xml(e.video.watch)}"><img src="${xml(e.image)}" alt="${xml(e.title)}"/></a></p>` : `<p><img src="${xml(e.image)}" alt="${xml(e.title)}"/></p>`);
        if (e.video) parts.push(`<p><a href="${xml(e.video.watch)}"><strong>▶ Video${e.video.label ? ` auf ${e.video.label}` : ""} ansehen</strong></a></p>`);
    }
    parts.push(paragraphs);
    if (e.clips.length) {
        parts.push(`<ul>${e.clips.map((c) => `<li><a href="${xml(c.url)}">▶ Clip${c.author ? ` von @${xml(c.author)}` : ""} auf Instagram</a></li>`).join("")}</ul>`);
    }
    if (e.external) parts.push(`<p>Quelle: <a href="${xml(e.external)}">${xml(p.source && p.source !== SITE_NAME ? p.source : e.external.replace(/^https?:\/\/(www\.)?/, "").split("/")[0])}</a></p>`);
    parts.push(`<p><a href="${xml(link)}"><strong>Weiterlesen auf ${SITE_NAME} →</strong></a></p>`);
    return parts.join("");
}

export function GET() {
    const posts = sortedPosts()
        .filter((p: any) => p.status !== "draft")
        .sort((a: any, b: any) => published(b).getTime() - published(a).getTime())
        .slice(0, FEED_SIZE);

    const items = posts.map((p: any) => {
        const e = feedEntry(p);
        const link = `${SITE_URL}/news/${p.id}/`;
        const categories = (p.tags || []).slice(0, 6).map((t: string) => `<category>${xml(t)}</category>`).join("");
        const media = [
            e.image ? `<enclosure url="${xml(e.image)}" type="${mime(e.image)}" length="0"/>` : "",
            e.image ? `<media:thumbnail url="${xml(e.image)}"/>` : "",
            e.video?.embed
                ? `<media:content url="${xml(e.video.watch)}" medium="video"><media:player url="${xml(e.video.embed)}"/></media:content>`
                : e.image ? `<media:content url="${xml(e.image)}" medium="image"/>` : "",
        ].filter(Boolean).join("\n      ");
        return `    <item>
      <title>${xml(e.title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${published(p).toUTCString()}</pubDate>
      <description>${xml(plainExcerpt(e.text || e.title, 300))}</description>
      <content:encoded>${cdata(itemHtml(p, e, link))}</content:encoded>
      ${media}
      ${categories}
    </item>`;
    }).join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xml(`${SITE_NAME} – Skateboard News`)}</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${xml(SITE_DESCRIPTION)}</description>
    <language>de-DE</language>
    <image>
      <url>${SITE_URL}/og-image.png</url>
      <title>${xml(`${SITE_NAME} – Skateboard News`)}</title>
      <link>${SITE_URL}/</link>
    </image>
    ${posts.length ? `<lastBuildDate>${published(posts[0]).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;
    return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
