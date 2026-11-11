import { NextResponse } from "next/server";
import { isAdminKey } from "@/lib/adminAuth";
import { rewriteNews, isRewritten } from "@/lib/gemini";

export const dynamic = "force-dynamic";

// Instagram blockt automatische Abrufe. Deshalb: Link + kopierter Beitragstext rein,
// Gemini schreibt daraus einen zweisprachigen Entwurf, der Instagram-Post wird eingebettet.
export async function POST(request: Request) {
    const { key, url, caption, account } = await request.json().catch(() => ({}));
    if (!isAdminKey(key)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const m = String(url || "").match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i);
    if (!m) return NextResponse.json({ error: "Das ist kein Instagram-Beitragslink (…/p/… oder …/reel/…)." }, { status: 400 });
    const text = String(caption || "").trim();
    if (text.length < 10) return NextResponse.json({ error: "Bitte den Text des Instagram-Beitrags einfügen." }, { status: 400 });

    const kind = m[1].toLowerCase() === "p" ? "p" : "reel";
    const cleanUrl = `https://www.instagram.com/${kind}/${m[2]}/`;
    const handle = String(account || "").replace(/^@/, "").trim();
    const source = handle ? `Instagram @${handle}` : "Instagram";
    const firstLine = text.split("\n").find((l) => l.trim().length > 3)?.trim().slice(0, 90) || "Instagram-Beitrag";

    const r: any = await rewriteNews({ title: firstLine, text, source });
    const ok = isRewritten(r);
    const de = ok ? r.de : { title: firstLine, content: `${text}\n\nQuelle: ${source}` };
    const en = ok ? r.en : { title: firstLine, content: `${text}\n\nSource: ${source}` };

    const article = {
        id: `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: de.title,
        description: String(de.content).slice(0, 200) + "...",
        translations: { de, en },
        type: kind === "reel" ? "video" : "image",
        content: cleanUrl,
        media: { images: [], videoUrl: cleanUrl, externalLink: handle ? `https://www.instagram.com/${handle}/` : cleanUrl },
        source,
        originalUrl: cleanUrl,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        tags: ok && Array.isArray(r.tags) ? r.tags.slice(0, 5) : ["Instagram"],
        status: "published",
    };
    return NextResponse.json({ article, rewritten: ok });
}
