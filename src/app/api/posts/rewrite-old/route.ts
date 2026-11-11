import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAdminKey } from "@/lib/adminAuth";
import { rewriteNews, isRewritten, applyRewrite, geminiConfigured } from "@/lib/gemini";
import { fetchArticleText } from "@/lib/articleText";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const isRaw = (p: any) => String(p?.translations?.de?.content || "").includes("(Originalquelle");

// Schreibt die neuesten alten Rohtext-Posts mit Gemini um (läuft nach Autoscan mit dem Rest-Limit).
export async function POST(request: Request) {
    const { key, limit = 10 } = await request.json().catch(() => ({}));
    if (!isAdminKey(key)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!geminiConfigured()) return NextResponse.json({ rewritten: 0, remaining: null, message: "Kein GEMINI_API_KEY." });

    const file = path.join(process.cwd(), "src", "data", "posts.json");
    const posts = JSON.parse(fs.readFileSync(file, "utf8"));
    const targets = posts.filter(isRaw).slice(0, Math.max(0, Math.min(Number(limit) || 0, 30)));

    let rewritten = 0;
    const titles: string[] = [];
    for (const p of targets) {
        const stored = String(p.translations?.en?.content || "").replace(/\.\.\.$/, "");
        const web = await fetchArticleText(p.originalUrl || p.media?.externalLink);
        const text = web.length > stored.length ? web : stored;
        const r = await rewriteNews({
            title: p.translations?.en?.title || String(p.title).replace(/^\[News\]\s*/, ""),
            text,
            source: p.source || "",
        });
        if (!isRewritten(r)) break; // Limit erreicht oder Fehler → für heute aufhören
        applyRewrite(p, r);
        rewritten++;
        titles.push(p.title);
        fs.writeFileSync(file, JSON.stringify(posts, null, 2));
    }

    return NextResponse.json({ rewritten, titles, remaining: posts.filter(isRaw).length });
}
