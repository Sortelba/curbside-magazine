import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// schema.org-Daten für Google: Website/Magazin, neueste Artikel und anstehende Events
// (Events können so als Rich Results in der Google-Suche erscheinen)

const abs = (u?: string) => (!u ? undefined : u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`);

function eventLd(e: any) {
    const start = e.startDateUtc;
    if (!start) return null;
    // "15.11.2026 - 18.11.2026" → Enddatum
    const m = String(e.date || "").match(/-\s*(\d{2})\.(\d{2})\.(\d{4})/);
    const end = m ? `${m[3]}-${m[2]}-${m[1]}` : start;
    return {
        "@type": "Event",
        name: e.title,
        startDate: start,
        endDate: end,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: { "@type": "Place", name: e.location || "TBA", address: e.location || "TBA" },
        description: e.description || undefined,
        image: e.flyerUrl ? [abs(e.flyerUrl)] : undefined,
        url: e.link || undefined,
        organizer: e.link ? { "@type": "Organization", name: e.location || e.title, url: e.link } : undefined,
    };
}

export default function StructuredData({ posts = [], events = [] }: { posts?: any[]; events?: any[] }) {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events
        .filter((e: any) => (e.startDateUtc || "") >= today)
        .sort((a: any, b: any) => a.startDateUtc.localeCompare(b.startDateUtc))
        .slice(0, 20)
        .map(eventLd)
        .filter(Boolean);

    const graph: any[] = [
        {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            description: SITE_DESCRIPTION,
            inLanguage: ["de-DE", "en"],
            publisher: { "@id": `${SITE_URL}/#org` },
        },
        {
            "@type": ["Organization", "NewsMediaOrganization"],
            "@id": `${SITE_URL}/#org`,
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/og-image.png`,
        },
    ];

    if (posts.length) {
        graph.push({
            "@type": "ItemList",
            name: "Neueste Skateboard-News",
            itemListElement: posts.slice(0, 10).map((p: any, i: number) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                    "@type": "NewsArticle",
                    headline: String(p.translations?.de?.title || p.title || "").slice(0, 110),
                    description: String(p.description || "").slice(0, 200),
                    datePublished: (() => { const d = new Date(p.date); return isNaN(d.getTime()) ? undefined : d.toISOString(); })(),
                    image: p.media?.images?.[0] ? [abs(p.media.images[0])] : undefined,
                    url: p.id ? `${SITE_URL}/news/${p.id}/` : `${SITE_URL}/`,
                    isBasedOn: p.originalUrl || undefined,
                    publisher: { "@id": `${SITE_URL}/#org` },
                },
            })),
        });
    }
    graph.push(...upcoming);

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }}
        />
    );
}
