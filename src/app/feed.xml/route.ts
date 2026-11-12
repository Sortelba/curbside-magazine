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

function itemHtml(p: any, title: string, text: string, image: string | null, link: string) {
    const paragraphs = String(text || "")
        .replace(/\(Originalquelle:[^)]*\)/, "")
        .split(/\n{2,}/)
        .map((block) => `<p>${xml(block.trim()).replace(/\n/g, "<br/>")}</p>`)
        .join("");
    const source = p.originalUrl ? `<p>Quelle: <a href="${xml(p.originalUrl)}">${xml(p.source || p.originalUrl)}</a></p>` : "";
    return `${image ? `<p><img src="${xml(image)}" alt="${xml(title)}"/></p>` : ""}${paragraphs}${source}<p><a href="${xml(link)}">Weiterlesen auf ${SITE_NAME}</a></p>`;
}

export function GET() {
    const posts = sortedPosts()
        .filter((p: any) => p.status !== "draft")
        .sort((a: any, b: any) => published(b).getTime() - published(a).getTime())
        .slice(0, FEED_SIZE);

    const items = posts.map((p: any) => {
        const title = String(p.translations?.de?.title || p.title).replace(/^\[News\]\s*/, "");
        const text = p.translations?.de?.content || p.description || "";
        const link = `${SITE_URL}/news/${p.id}/`;
        const rawImage = p.media?.images?.[0] || (p.type === "image" ? p.content : "");
        const image = rawImage ? abs(rawImage) : null;
        const categories = (p.tags || []).slice(0, 6).map((t: string) => `<category>${xml(t)}</category>`).join("");
        return `    <item>
      <title>${xml(title)}</title>
      <link>${xml(link)}</link>
      <guid isPermaLink="true">${xml(link)}</guid>
      <pubDate>${published(p).toUTCString()}</pubDate>
      <description>${xml(plainExcerpt(text, 300))}</description>
      <content:encoded>${cdata(itemHtml(p, title, text, image, link))}</content:encoded>
      ${image ? `<enclosure url="${xml(image)}" type="${mime(image)}" length="0"/>
      <media:content url="${xml(image)}" medium="image"/>` : ""}
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
