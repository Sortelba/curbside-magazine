import fs from "fs";
import path from "path";

// Bild-Links von Instagram, Facebook und Bing enthalten Ablaufzeiten und sind nach
// einiger Zeit kaputt. Solche Bilder werden beim Veröffentlichen nach
// public/uploads/posts/ kopiert und der Post zeigt dann auf die lokale Datei.
const EXPIRING_HOSTS = /(cdninstagram\.com|fbcdn\.net|bing\.net|bing\.com\/th)/i;
const MAX_BYTES = 8 * 1024 * 1024;

export function isExpiringImage(url?: string): boolean {
    return typeof url === "string" && /^https?:\/\//.test(url) && EXPIRING_HOSTS.test(url);
}

function extFor(contentType: string | null): string {
    if (!contentType) return ".jpg";
    if (contentType.includes("png")) return ".png";
    if (contentType.includes("webp")) return ".webp";
    if (contentType.includes("gif")) return ".gif";
    return ".jpg";
}

/** Lädt ein Bild herunter und gibt den lokalen Pfad (/uploads/posts/...) zurück, sonst null. */
export async function downloadImage(url: string, baseName: string): Promise<string | null> {
    try {
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" },
            signal: AbortSignal.timeout(20000),
        });
        const type = res.headers.get("content-type");
        if (!res.ok || !type?.startsWith("image/")) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length === 0 || buf.length > MAX_BYTES) return null;
        const dir = path.join(process.cwd(), "public", "uploads", "posts");
        fs.mkdirSync(dir, { recursive: true });
        const file = `${baseName}${extFor(type)}`;
        fs.writeFileSync(path.join(dir, file), buf);
        return `/uploads/posts/${file}`;
    } catch {
        return null;
    }
}

/** Ersetzt ablaufende Bild-Links eines Posts durch lokale Kopien. Gibt die Anzahl zurück. */
export async function localizePostImages(post: any): Promise<number> {
    const id = String(post?.id || `post_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "");
    const done = new Map<string, string>();
    let count = 0;

    const localize = async (url: string) => {
        if (!isExpiringImage(url)) return url;
        if (done.has(url)) return done.get(url)!;
        const local = await downloadImage(url, `${id}-${done.size + 1}`);
        if (local) {
            done.set(url, local);
            count++;
            return local;
        }
        return url;
    };

    if (Array.isArray(post?.media?.images)) {
        const out: string[] = [];
        for (const img of post.media.images) out.push(await localize(img));
        post.media.images = out;
    }
    if (typeof post?.content === "string") post.content = await localize(post.content);
    if (typeof post?.mediaUrl === "string") post.mediaUrl = await localize(post.mediaUrl);
    return count;
}
