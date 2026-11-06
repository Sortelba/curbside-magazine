// Erkennt doppelte Beiträge – auch wenn dieselbe Story von zwei Magazinen kommt.
// Ein Beitrag gilt als Duplikat, wenn eines davon zutrifft:
//   1. gleiche Artikel-URL (ohne http/https, www, Tracking-Parameter, Slash am Ende)
//   2. gleiches eingebettetes Video (YouTube-ID bzw. Video-URL)
//   3. sehr ähnlicher Titel (nicht bei Instagram, dort sind Titel generisch)

type AnyPost = Record<string, any>;

const STOPWORDS = new Set([
    // Deutsch
    'der', 'die', 'das', 'und', 'oder', 'von', 'vom', 'mit', 'im', 'in', 'am', 'an', 'auf', 'aus', 'zu', 'zum', 'zur',
    'ein', 'eine', 'einen', 'ist', 'sind', 'fur', 'für', 'bei', 'neues', 'neuer', 'neue', 'neu',
    // Englisch
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'with', 'by', 'on', 'at', 'from', 'is', 'his', 'her', 'their', 'new',
    // Typische Zusätze ohne Inhalt
    'news', 'part', 'video', 'full', 'official', 'clip', 'insta', 'instagram', 'youtube',
    // Kommen in fast jedem Titel vor und unterscheiden nichts
    'skate', 'skater', 'skateboard', 'skateboards', 'skateboarding',
]);

const isYear = (w: string) => /^(19|20)\d\d$/.test(w);
const isNumber = (w: string) => /^\d+$/.test(w);

/** URL vergleichbar machen: Schema, www, Query/Hash und Slash am Ende entfernen. */
export function normalizeUrl(url?: string): string {
    if (!url || typeof url !== 'string') return '';
    return url
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '');
}

/** YouTube-Video-ID aus embed-, watch-, youtu.be- oder shorts-Links. */
export function youtubeId(url?: string): string {
    if (!url || typeof url !== 'string') return '';
    const m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?(?:.*&)?v=)|youtu\.be\/)([\w-]{11})/i);
    return m ? m[1] : '';
}

function articleUrls(post: AnyPost): string[] {
    return [post.originalUrl, post.url, post.media?.externalLink]
        .map(normalizeUrl)
        .filter(Boolean);
}

function videoKeys(post: AnyPost): string[] {
    const candidates = [post.media?.videoUrl, post.content, post.mediaUrl, post.url, post.originalUrl];
    const keys = new Set<string>();
    for (const c of candidates) {
        const id = youtubeId(c);
        if (id) keys.add(`yt:${id}`);
    }
    // Andere Video-Links (z. B. Instagram, Vimeo) direkt vergleichen
    const video = normalizeUrl(post.media?.videoUrl);
    if (video && !youtubeId(post.media?.videoUrl)) keys.add(`v:${video}`);
    return [...keys];
}

export function titleTokens(title?: string): string[] {
    if (!title || typeof title !== 'string') return [];
    return title
        .toLowerCase()
        .replace(/\[[^\]]*\]/g, ' ') // "[News]" usw.
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // Akzente
        .replace(/[^a-z0-9]+/g, ' ')
        .split(' ')
        .filter(w => (w.length >= 2 || isNumber(w)) && !STOPWORDS.has(w) && !isYear(w));
}

function postTitles(post: AnyPost): string[] {
    return [post.title, post.translations?.de?.title, post.translations?.en?.title].filter(Boolean);
}

function isSocial(post: AnyPost): boolean {
    return post.source === 'Instagram' || /instagram/i.test(post.type || '');
}

/** Titel ähnlich, wenn fast alle Wörter des kürzeren Titels im längeren vorkommen. */
export function similarTitles(a: string, b: string): boolean {
    const ta = new Set(titleTokens(a));
    const tb = new Set(titleTokens(b));
    if (ta.size === 0 || tb.size === 0) return false;
    // Unterschiedliche Nummern ("Try this #14" vs. "#215", "Vol. 2" vs. "Vol. 3") = verschiedene Beiträge
    const na = [...ta].filter(isNumber);
    const nb = [...tb].filter(isNumber);
    if (na.length > 0 && nb.length > 0 && !na.some(n => nb.includes(n))) return false;
    const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
    // Bei sehr kurzen Titeln nur exakte Übereinstimmung, sonst zu viele Fehltreffer
    if (small.size < 3) return small.size === big.size && [...small].every(w => big.has(w));
    let shared = 0;
    for (const w of small) if (big.has(w)) shared++;
    return shared / small.size >= 0.8;
}

/** Gibt den bereits vorhandenen Beitrag zurück, falls `post` ein Duplikat ist. */
export function findDuplicate(post: AnyPost, existing: AnyPost[]): AnyPost | null {
    const urls = new Set(articleUrls(post));
    const videos = new Set(videoKeys(post));
    const titles = isSocial(post) ? [] : postTitles(post);

    for (const other of existing) {
        if (!other || other === post) continue;
        if (post.id && other.id === post.id) return other;
        if (articleUrls(other).some(u => urls.has(u))) return other;
        const otherVideos = videoKeys(other);
        if (otherVideos.some(v => videos.has(v))) return other;
        // Beide haben ein Video, aber verschiedene → verschiedene Beiträge, Titel egal
        const bothHaveDifferentVideos = videos.size > 0 && otherVideos.length > 0;
        if (titles.length > 0 && !isSocial(other) && !bothHaveDifferentVideos) {
            const otherTitles = postTitles(other);
            if (titles.some(t => otherTitles.some(o => similarTitles(t, o)))) return other;
        }
    }
    return null;
}
