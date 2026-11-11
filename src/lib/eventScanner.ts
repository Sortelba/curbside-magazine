// Skate-Event-Scanner: sucht europaweit nach kommenden Skateboard-Events.
//
// Quellen:
//   1. The Boardr           – größter Contest-Kalender (nur europäische Events)
//   2. Skateboard Germany   – offizieller Verband (Wix-Eventliste)
//   3. Blue Tomato Events   – Shop-/Contest-Events in Europa
//   4. Skateboard Event Calendar (skateboardeventcalendar.com) – weltweiter, gepflegter
//                             Kalender; alle Events stecken als Daten in einer Seite
//   5. Websuche (Bing)      – viele Suchbegriffe in mehreren Sprachen inkl.
//                             #skatecontest; gefundene Seiten werden geöffnet und
//                             nach Event-Daten (schema.org) bzw. Datum + Ort durchsucht.
//
// Ergebnis sind *Vorschläge*: Sie werden im Admin-Kalender angezeigt und erst nach
// "Übernehmen" in events.json gespeichert.
import * as cheerio from 'cheerio';
import { normalizeUrl, similarTitles } from './dedupe';

export type EventSuggestion = {
    id: string;
    title: string;
    date: string;          // Anzeige, z. B. "16.11.2026" oder "16.11.2026 - 18.11.2026"
    startDateUtc: string;  // YYYY-MM-DD
    endDateUtc?: string;
    location: string;
    link: string;
    description: string;
    flyerUrl: string;
    source: string;
    confidence: 'hoch' | 'mittel' | 'niedrig';
};

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

async function fetchText(url: string, timeoutMs = 12000): Promise<string> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': UA, 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8' },
            signal: ctrl.signal,
            redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

/** Führt Aufgaben mit begrenzter Parallelität aus. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const i = next++;
            results[i] = await fn(items[i]);
        }
    });
    await Promise.all(workers);
    return results;
}

// ---------------------------------------------------------------------------
// Datum
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {};
const monthNames: [number, string[]][] = [
    [1, ['januar', 'jänner', 'january', 'janvier', 'enero', 'gennaio', 'januari', 'jan']],
    [2, ['februar', 'february', 'février', 'fevrier', 'febrero', 'febbraio', 'februari', 'feb']],
    [3, ['märz', 'maerz', 'march', 'mars', 'marzo', 'maart', 'mar']],
    [4, ['april', 'avril', 'abril', 'aprile', 'apr']],
    [5, ['mai', 'may', 'mayo', 'maggio', 'mei']],
    [6, ['juni', 'june', 'juin', 'junio', 'giugno', 'jun']],
    [7, ['juli', 'july', 'juillet', 'julio', 'luglio', 'jul']],
    [8, ['august', 'août', 'aout', 'agosto', 'augustus', 'aug']],
    [9, ['september', 'septembre', 'septiembre', 'settembre', 'sept', 'sep']],
    [10, ['oktober', 'october', 'octobre', 'octubre', 'ottobre', 'okt', 'oct']],
    [11, ['november', 'novembre', 'noviembre', 'nov']],
    [12, ['dezember', 'december', 'décembre', 'decembre', 'diciembre', 'dicembre', 'dez', 'dec']],
];
for (const [n, names] of monthNames) for (const name of names) MONTHS[name] = n;
const MONTH_RE = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');

function iso(y: number, m: number, d: number): string {
    if (y < 100) y += 2000;
    if (m < 1 || m > 12 || d < 1 || d > 31) return '';
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCMonth() !== m - 1) return '';
    return date.toISOString().slice(0, 10);
}

type DateRange = { start: string; end?: string; index: number };

/** Findet alle Datumsangaben (auch Zeiträume) in einem Text. */
export function findDates(text: string): DateRange[] {
    const found: DateRange[] = [];
    const add = (index: number, start: string, end?: string) => {
        if (!start) return;
        found.push({ index, start, end: end && end > start ? end : undefined });
    };
    let m: RegExpExecArray | null;

    // 2026-11-16
    const reIso = /\b(20\d\d)-(\d{2})-(\d{2})\b/g;
    while ((m = reIso.exec(text))) add(m.index, iso(+m[1], +m[2], +m[3]));

    // 16.11.2026 | 16.-18.11.2026 | 16.11.-18.11.2026 | 16.11.2026 - 18.11.2026 | 12-13/9/2026 | 29/08/2026
    const reNum = /\b(\d{1,2})[./](?:\s?(\d{1,2})[./])?\s?(?:[-–]\s?(\d{1,2})[./]\s?(?:(\d{1,2})[./]\s?)?)?(20\d\d)\b|\b(\d{1,2})\s?[-–]\s?(\d{1,2})[./](\d{1,2})[./](20\d\d)\b/g;
    while ((m = reNum.exec(text))) {
        if (m[9]) {
            // 12-13/9/2026
            add(m.index, iso(+m[9], +m[8], +m[6]), iso(+m[9], +m[8], +m[7]));
            continue;
        }
        const y = +m[5];
        const d1 = +m[1];
        if (m[2] && m[3] && m[4]) add(m.index, iso(y, +m[2], d1), iso(y, +m[4], +m[3]));        // 16.11.-18.12.2026
        else if (m[2] && m[3]) add(m.index, iso(y, +m[2], d1), iso(y, +m[2], +m[3]));            // ungewöhnlich, Monat gleich
        else if (!m[2] && m[3] && m[4]) add(m.index, iso(y, +m[4], d1), iso(y, +m[4], +m[3]));   // 16.-18.11.2026
        else if (m[2]) add(m.index, iso(y, +m[2], d1));                                          // 16.11.2026
    }
    // "16.11.2026 - 18.11.2026"
    const reNumRange = /\b(\d{1,2})\.(\d{1,2})\.(20\d\d)\s?[-–]\s?(\d{1,2})\.(\d{1,2})\.(20\d\d)\b/g;
    while ((m = reNumRange.exec(text))) add(m.index, iso(+m[3], +m[2], +m[1]), iso(+m[6], +m[5], +m[4]));

    // 16. November 2026 | 6-8 November 2026 | 16 nov. 2026
    const reDayMonth = new RegExp(`\\b(\\d{1,2})\\.?(?:\\s?[-–]\\s?(\\d{1,2})\\.?)?\\s(${MONTH_RE})\\.?,?\\s(20\\d\\d)\\b`, 'gi');
    while ((m = reDayMonth.exec(text))) {
        const mo = MONTHS[m[3].toLowerCase()];
        add(m.index, iso(+m[4], mo, +m[1]), m[2] ? iso(+m[4], mo, +m[2]) : undefined);
    }
    // November 6 - 8, 2026 | November 6, 2026
    const reMonthDay = new RegExp(`\\b(${MONTH_RE})\\.?\\s(\\d{1,2})(?:st|nd|rd|th)?(?:\\s?[-–]\\s?(\\d{1,2}))?,?\\s(20\\d\\d)\\b`, 'gi');
    while ((m = reMonthDay.exec(text))) {
        const mo = MONTHS[m[1].toLowerCase()];
        add(m.index, iso(+m[4], mo, +m[2]), m[3] ? iso(+m[4], mo, +m[3]) : undefined);
    }

    return found.sort((a, b) => a.index - b.index);
}

let todayOverride = '';
function todayIso(): string {
    return todayOverride || new Date().toISOString().slice(0, 10);
}

function firstFutureDate(text: string, maxDaysAhead = 450): DateRange | null {
    const today = todayIso();
    const limit = new Date(new Date(today).getTime() + maxDaysAhead * 86400000).toISOString().slice(0, 10);
    return findDates(text).find(d => (d.end || d.start) >= today && d.start <= limit) || null;
}

function displayDate(start: string, end?: string): string {
    const f = (s: string) => s.split('-').reverse().join('.');
    return end && end !== start ? `${f(start)} - ${f(end)}` : f(start);
}

/** ISO-Datum aus beliebigen Datumsstrings (ISO, "11/6/2026 5:00:00 PM", ...). */
function toIsoDate(value?: string): string {
    if (!value) return '';
    const m = value.match(/^(20\d\d)-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(20\d\d)/);
    if (us) return iso(+us[3], +us[1], +us[2]);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Europa
// ---------------------------------------------------------------------------

const EUROPE = [
    // Länder (de / en / Landessprache)
    'deutschland', 'germany', 'österreich', 'oesterreich', 'austria', 'schweiz', 'switzerland', 'suisse', 'svizzera',
    'frankreich', 'france', 'spanien', 'spain', 'españa', 'espana', 'portugal', 'italien', 'italy', 'italia',
    'niederlande', 'netherlands', 'nederland', 'holland', 'belgien', 'belgium', 'belgique', 'belgië', 'luxemburg', 'luxembourg',
    'dänemark', 'denmark', 'danmark', 'schweden', 'sweden', 'sverige', 'norwegen', 'norway', 'norge', 'finnland', 'finland', 'suomi',
    'polen', 'poland', 'polska', 'tschechien', 'czech', 'česko', 'slowakei', 'slovakia', 'ungarn', 'hungary', 'slowenien', 'slovenia',
    'kroatien', 'croatia', 'serbien', 'serbia', 'rumänien', 'romania', 'bulgarien', 'bulgaria', 'griechenland', 'greece',
    'irland', 'ireland', 'england', 'scotland', 'schottland', 'wales', 'united kingdom', 'großbritannien', 'uk',
    'estland', 'estonia', 'lettland', 'latvia', 'litauen', 'lithuania', 'island', 'iceland', 'malta', 'zypern', 'cyprus',
    'ukraine', 'türkei', 'turkey', 'monaco', 'liechtenstein', 'andorra', 'europe', 'europa',
    // Städte (Skate-Hotspots + Großstädte)
    'berlin', 'hamburg', 'münchen', 'muenchen', 'munich', 'köln', 'koeln', 'cologne', 'frankfurt', 'stuttgart', 'düsseldorf',
    'leipzig', 'dresden', 'dortmund', 'essen', 'bremen', 'hannover', 'nürnberg', 'karlsruhe', 'mannheim', 'freiburg', 'münster',
    'mönchengladbach', 'kassel', 'oldenburg', 'konstanz', 'würzburg', 'heidelberg', 'saarbrücken', 'dessau', 'kiel', 'rostock',
    'wien', 'vienna', 'graz', 'linz', 'salzburg', 'innsbruck', 'zürich', 'zurich', 'basel', 'bern', 'genf', 'geneva', 'lausanne',
    'paris', 'lyon', 'marseille', 'montpellier', 'bordeaux', 'toulouse', 'nantes', 'nice', 'lille', 'strasbourg',
    'barcelona', 'madrid', 'valencia', 'malaga', 'bilbao', 'vigo', 'lissabon', 'lisbon', 'lisboa', 'porto', 'ericeira',
    'rom', 'rome', 'roma', 'mailand', 'milan', 'milano', 'turin', 'torino', 'bologna', 'neapel', 'napoli',
    'amsterdam', 'rotterdam', 'utrecht', 'den haag', 'eindhoven', 'brüssel', 'brussels', 'bruxelles', 'antwerpen', 'gent',
    'kopenhagen', 'copenhagen', 'malmö', 'malmo', 'stockholm', 'göteborg', 'oslo', 'helsinki', 'prag', 'prague', 'praha',
    'warschau', 'warsaw', 'krakau', 'kraków', 'budapest', 'ljubljana', 'zagreb', 'bratislava', 'bukarest', 'athen', 'athens',
    'london', 'manchester', 'bristol', 'leeds', 'liverpool', 'glasgow', 'edinburgh', 'dublin', 'cardiff', 'birmingham',
];
const NON_EUROPE = [
    'usa', 'united states', 'california', 'florida', 'texas', 'new york', 'oregon', 'arizona', 'nevada', 'georgia, usa',
    'atlanta', 'los angeles', 'san diego', 'san francisco', 'tampa', 'encinitas', 'austin', 'houston', 'salt lake', 'utah',
    'iowa', 'des moines', 'north carolina', 'nc', 'ohio', 'colorado', 'washington', 'canada', 'mexico', 'brazil', 'brasil',
    'são paulo', 'sao paulo', 'argentina', 'chile', 'paraguay', 'peru', 'japan', 'tokyo', 'china', 'shanghai', 'korea',
    'australia', 'sydney', 'melbourne', 'new zealand', 'south africa', 'dubai', 'india', 'senegal', 'dakar', 'atlantic ocean',
];
const EUROPEAN_TLDS = ['de', 'at', 'ch', 'fr', 'es', 'pt', 'it', 'nl', 'be', 'lu', 'dk', 'se', 'no', 'fi', 'pl', 'cz', 'sk', 'hu',
    'si', 'hr', 'rs', 'ro', 'bg', 'gr', 'ie', 'uk', 'ee', 'lv', 'lt', 'is', 'mt', 'cy', 'eu', 'li', 'mc'];

function wordIn(text: string, word: string): boolean {
    return new RegExp(`(^|[^a-zäöüéèàçñ])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-zäöüéèàçñ])`, 'i').test(text);
}

/** true = Europa, false = sicher nicht Europa, null = unbekannt */
export function europeCheck(location: string): boolean | null {
    const loc = location.toLowerCase();
    if (!loc.trim()) return null;
    if (NON_EUROPE.some(w => wordIn(loc, w))) return false;
    if (EUROPE.some(w => wordIn(loc, w))) return true;
    return null;
}

function findEuropeanPlace(text: string): string {
    const lower = text.toLowerCase();
    let best: { word: string; idx: number } | null = null;
    for (const w of EUROPE) {
        if (w === 'europe' || w === 'europa' || w === 'uk' || w === 'island') continue;
        const re = new RegExp(`(^|[^a-zäöüéèàçñ])${w}($|[^a-zäöüéèàçñ])`, 'i');
        const m = re.exec(lower);
        if (m && (!best || m.index < best.idx)) best = { word: w, idx: m.index };
    }
    if (!best) return '';
    // Originalschreibweise aus dem Text übernehmen
    const start = best.idx + (lower[best.idx]?.match(/[a-zäöüéèàçñ]/i) ? 0 : 1);
    return text.substr(start, best.word.length);
}

function isEuropeanTld(url: string): boolean {
    try {
        const host = new URL(url).hostname;
        return EUROPEAN_TLDS.includes(host.split('.').pop() || '');
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// Relevanz
// ---------------------------------------------------------------------------

const SKATE_RE = /skate|skateboard|rollbrett|bowl\s?jam|mini\s?ramp|miniramp|street\s?league|go skateboarding day/i;
const EVENT_RE = /contest|jam|meisterschaft|championship|cup|open|festival|fest|session|battle|tour|competition|compétition|campeonato|gara|wedstrijd|zawody|mastership|demo|event|qualifier|games|day/i;
const EXCLUDE_RE = /rollerdisco|roller disco|rollschuh|eiskunstlauf|eislauf|ice\s?skat|figure skat|patinage artistique|roller\s?derby|inline\s?speed|electronic arts|\bsteam\b|epic games|poki|playstation|xbox|skate\.\s|skate™|skateshop|skate shop|kaufen|online shop|komplettboard|wikipedia|amazon\.|ebay\./i;

function isSkateEvent(title: string, description: string): boolean {
    const t = `${title} ${description}`;
    return SKATE_RE.test(t) && EVENT_RE.test(t) && !EXCLUDE_RE.test(title);
}

function clean(s?: string, max = 400): string {
    if (!s) return '';
    const text = cheerio.load(`<div>${s}</div>`).text().replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const TLD_COUNTRY: Record<string, string> = {
    de: 'Deutschland', at: 'Österreich', ch: 'Schweiz', fr: 'Frankreich', es: 'Spanien', pt: 'Portugal', it: 'Italien',
    nl: 'Niederlande', be: 'Belgien', lu: 'Luxemburg', dk: 'Dänemark', se: 'Schweden', no: 'Norwegen', fi: 'Finnland',
    pl: 'Polen', cz: 'Tschechien', sk: 'Slowakei', hu: 'Ungarn', si: 'Slowenien', hr: 'Kroatien', ie: 'Irland', uk: 'UK',
};

/** Titel aufräumen: Seitennamen, "» Event", "MORE INFO", Datum und Wiederholungen entfernen. */
function cleanTitle(raw: string): string {
    let t = clean(raw, 200)
        .replace(/\b(more info|mehr info(s)?|read more|weiterlesen|details|tickets?|anmelden)\b/gi, ' ')
        .replace(/\s+[»|·–—-]\s+(event|events|veranstaltung|termine?)\s*$/i, '')
        .replace(/\s+[|»·]\s+[^|»·]{2,40}$/, '')                 // " | Seitenname"
        .replace(/\s+[-–]\s+\d{1,2}\.\d{1,2}\.(20\d\d)?\s*$/, '')   // " - 19.09.2026"
        .replace(/^\d{1,2}\.\d{1,2}\.20\d\d\s*[-–:]\s*/, '')          // "15.08.2026 - "
        .replace(/\s{2,}/g, ' ')
        .trim();
    // "ODK Skate contest ODK Skate contest" → einmal
    const words = t.split(' ');
    const half = Math.floor(words.length / 2);
    if (words.length >= 4 && words.length % 2 === 0 && words.slice(0, half).join(' ').toLowerCase() === words.slice(half).join(' ').toLowerCase()) {
        t = words.slice(0, half).join(' ');
    }
    return t.slice(0, 120);
}

function makeSuggestion(p: Omit<EventSuggestion, 'id' | 'date'> & { endDateUtc?: string }): EventSuggestion {
    let location = clean(p.location, 120);
    if (!location) {
        try {
            location = TLD_COUNTRY[new URL(p.link).hostname.split('.').pop() || ''] || '';
        } catch { /* kein Ort */ }
    }
    return {
        ...p,
        id: `event_scan_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
        date: displayDate(p.startDateUtc, p.endDateUtc),
        title: cleanTitle(p.title),
        description: clean(p.description, 400),
        location,
    };
}

const GENERIC_TITLE_RE = /^(past|upcoming|next|kommende|vergangene|alle)?\s*(events?|termine|veranstaltungen|kalender|calendar|contests?|news)$/i;

// ---------------------------------------------------------------------------
// schema.org-Events (JSON-LD) – viele Veranstaltungsseiten liefern diese
// ---------------------------------------------------------------------------

function jsonLdEvents(html: string, pageUrl: string, source: string): EventSuggestion[] {
    const $ = cheerio.load(html);
    const out: EventSuggestion[] = [];
    const visit = (node: any) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(visit);
        if (node['@graph']) visit(node['@graph']);
        const type = [].concat(node['@type'] || []).join(' ');
        if (/Event/.test(type) && node.startDate) {
            const start = toIsoDate(node.startDate);
            const end = toIsoDate(node.endDate);
            const loc = [].concat(node.location || [])[0] as any;
            const address = loc?.address;
            const location = [
                loc?.name,
                typeof address === 'string' ? address : address?.addressLocality,
                typeof address === 'object' ? (address?.addressCountry?.name || address?.addressCountry) : '',
            ].filter(x => x && typeof x === 'string').filter((x, i, a) => a.indexOf(x) === i).join(', ');
            const image = [].concat(node.image || [])[0] as any;
            if (start) {
                out.push(makeSuggestion({
                    title: node.name || '',
                    startDateUtc: start,
                    endDateUtc: end && end > start ? end : undefined,
                    location,
                    link: typeof node.url === 'string' ? node.url : pageUrl,
                    description: node.description || '',
                    flyerUrl: typeof image === 'string' ? image : image?.url || '',
                    source,
                    confidence: 'hoch',
                }));
            }
        }
        for (const k of Object.keys(node)) if (typeof node[k] === 'object' && k !== '@graph') visit(node[k]);
    };
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            visit(JSON.parse($(el).contents().text()));
        } catch { /* kaputtes JSON ignorieren */ }
    });
    return out;
}

/** Event aus einer beliebigen Webseite: erst JSON-LD, sonst Titel + Datum + Ort aus dem Text. */
async function eventsFromPage(url: string, source: string, hint?: { title?: string; snippet?: string }): Promise<EventSuggestion[]> {
    let html = '';
    try {
        html = await fetchText(url, 10000);
    } catch {
        // Seite nicht erreichbar: nur mit Suchergebnis-Text arbeiten
    }

    if (html) {
        const structured = jsonLdEvents(html, url, source);
        if (structured.length > 0) return structured;
    }

    const $ = cheerio.load(html || '<html></html>');
    $('script, style, noscript, nav, footer, header').remove();

    const listed = listEventsFromPage($, url, source);
    if (listed.length >= 2) return listed;
    const title = ($('meta[property="og:title"]').attr('content') || $('h1').first().text() || $('title').text() || hint?.title || '').trim();
    const metaDesc = ($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '').trim();
    const body = $('main').text() || $('article').text() || $('body').text();
    const text = `${hint?.title || ''} ${hint?.snippet || ''} ${title} ${metaDesc} ${body}`.replace(/\s+/g, ' ');

    if (!isSkateEvent(title || hint?.title || '', `${metaDesc} ${hint?.snippet || ''} ${body.slice(0, 3000)}`)) return [];

    // Datum bevorzugt aus Titel/Snippet/Beschreibung, sonst aus dem Anfang des Seitentexts
    const date = firstFutureDate(`${hint?.title || ''} ${title} ${hint?.snippet || ''} ${metaDesc}`) || firstFutureDate(body.replace(/\s+/g, ' ').slice(0, 6000));
    if (!date) return [];

    const location = findEuropeanPlace(`${title} ${metaDesc} ${hint?.snippet || ''} ${body.slice(0, 6000)}`);
    return [makeSuggestion({
        title: title || hint?.title || 'Skate Event',
        startDateUtc: date.start,
        endDateUtc: date.end,
        location,
        link: url,
        description: metaDesc || hint?.snippet || '',
        flyerUrl: $('meta[property="og:image"]').attr('content') || '',
        source,
        confidence: 'niedrig',
    })].filter(() => text.length > 0);
}

/**
 * Kalender-/Übersichtsseiten mit mehreren Events (z. B. "Belgian Championship 12-13/9/2026",
 * Listen auf Vereinsseiten): jede Überschrift/Zeile mit Skate-Bezug und Datum wird ein Vorschlag.
 */
function listEventsFromPage($: cheerio.CheerioAPI, pageUrl: string, source: string): EventSuggestion[] {
    const out: EventSuggestion[] = [];
    const today = todayIso();
    const seen = new Set<string>();
    $('h2, h3, h4, li, tr, article, .event, [class*="event"]').each((_, el) => {
        const node = $(el);
        // Zu große Container überspringen (ganze Seite / Spalten)
        const text = node.text().replace(/\s+/g, ' ').trim();
        if (text.length < 8 || text.length > 400) return;
        let context = text;
        // Überschrift: Datum steht oft im nächsten Absatz
        if (/^h[2-4]$/i.test(el.tagName)) {
            context = `${text} ${node.nextAll().slice(0, 2).text().replace(/\s+/g, ' ').slice(0, 250)}`;
        }
        const date = findDates(context).find(d => (d.end || d.start) >= today);
        if (!date) return;
        if (!SKATE_RE.test(context) && !SKATE_RE.test(source + pageUrl)) return;
        if (!EVENT_RE.test(context)) return;
        // Titel = Text ohne das Datum
        const title = text.replace(/\b\d{1,2}[./-].{0,25}20\d\d\b/g, '').replace(/\s{2,}/g, ' ').replace(/^[\s|:–-]+|[\s|:–-]+$/g, '').slice(0, 120);
        if (title.length < 4) return;
        const key = `${title.toLowerCase()}|${date.start}`;
        if (seen.has(key)) return;
        seen.add(key);
        const href = node.find('a[href]').first().attr('href') || node.closest('a[href]').attr('href');
        let link = pageUrl;
        try { if (href) link = new URL(href, pageUrl).toString(); } catch { /* Seiten-URL */ }
        out.push(makeSuggestion({
            title,
            startDateUtc: date.start,
            endDateUtc: date.end,
            location: findEuropeanPlace(context),
            link,
            description: context.slice(0, 300),
            flyerUrl: '',
            source,
            confidence: 'mittel',
        }));
    });
    return out.slice(0, 25);
}

// ---------------------------------------------------------------------------
// Quellen
// ---------------------------------------------------------------------------

async function scanBoardr(): Promise<EventSuggestion[]> {
    const html = await fetchText('https://www.theboardr.com/events');
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return [];
    const data = JSON.parse(m[1]);
    const list: any[] = data?.props?.pageProps?.eventList || [];
    return list.map(e => {
        const start = toIsoDate(e.StartDate);
        const end = toIsoDate(e.ExpireDate);
        const slug = String(e.Title || '').replace(/\s+/g, '_');
        return makeSuggestion({
            title: e.Title,
            startDateUtc: start,
            endDateUtc: end && end > start ? end : undefined,
            location: e.Location || '',
            link: `https://www.theboardr.com/events/${e.EventID}/${encodeURIComponent(slug)}`,
            description: e.ShortDescription || '',
            flyerUrl: e.HeroImage ? `https://theboardr.blob.core.windows.net/eventsicons/${e.EventID}hero600.jpg` : '',
            source: 'The Boardr',
            confidence: 'hoch',
        });
    }).filter(e => e.startDateUtc);
}

async function scanSkateboardGermany(): Promise<EventSuggestion[]> {
    const html = await fetchText('https://www.skateboard-germany.de/events');
    const out: EventSuggestion[] = [];
    // Wix bettet die Events als JSON ein: "events":[{...}]
    let from = 0;
    while (true) {
        const i = html.indexOf('"events":[{', from);
        if (i < 0) break;
        const start = i + 9;
        let depth = 0;
        let j = start;
        for (; j < html.length; j++) {
            if (html[j] === '[') depth++;
            else if (html[j] === ']') { depth--; if (depth === 0) break; }
        }
        from = j;
        try {
            const arr = JSON.parse(html.slice(start, j + 1));
            for (const e of arr) {
                const s = toIsoDate(e.scheduling?.config?.startDate);
                const en = toIsoDate(e.scheduling?.config?.endDate);
                if (!s) continue;
                out.push(makeSuggestion({
                    title: e.title,
                    startDateUtc: s,
                    endDateUtc: en && en > s ? en : undefined,
                    location: e.location?.name || e.location?.address || '',
                    link: e.slug ? `https://www.skateboard-germany.de/event-details/${e.slug}` : 'https://www.skateboard-germany.de/events',
                    description: e.description || e.about || '',
                    flyerUrl: e.mainImage?.url || '',
                    source: 'Skateboard Germany',
                    confidence: 'hoch',
                }));
            }
        } catch { /* weiter */ }
    }
    return out;
}

async function scanBlueTomato(): Promise<EventSuggestion[]> {
    const base = 'https://www.blue-tomato.com';
    const html = await fetchText(`${base}/de-DE/blue-world/events/`);
    const links = [...new Set([...html.matchAll(/href="(\/de-DE\/blue-world\/events\/[a-z0-9-]+\/)"/g)].map(m => base + m[1]))]
        .filter(l => !/blue-tomato-shop-events|filmfestival|photo-project/.test(l))
        .slice(0, 20);
    const results = await mapLimit(links, 5, l => eventsFromPage(l, 'Blue Tomato').catch(() => []));
    return results.flat().map(e => ({ ...e, confidence: e.confidence === 'niedrig' ? 'mittel' : e.confidence }));
}

// skateboardeventcalendar.com ist eine Next.js-Seite: Die Event-Liste steckt in den
// eingebetteten Daten (self.__next_f). Objekte verweisen mit "$<id>" auf andere Zeilen.
const COUNTRY_DE = (() => {
    try { return new Intl.DisplayNames(['de'], { type: 'region' }); } catch { return null; }
})();

async function scanSkateboardEventCalendar(): Promise<EventSuggestion[]> {
    const html = await fetchText('https://skateboardeventcalendar.com/de/', 15000);
    let flight = '';
    for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
        try { flight += JSON.parse(m[1]); } catch { /* Teil überspringen */ }
    }
    const rows = new Map<string, string>();
    for (const line of flight.split('\n')) {
        const m = line.match(/^([0-9a-f]+):(.*)$/);
        if (m) rows.set(m[1], m[2]);
    }
    const val = (id: string): any => {
        const r = rows.get(id);
        if (r == null) return undefined;
        if (r.startsWith('T')) return r.replace(/^T[0-9a-f]+,/, '');
        try { return JSON.parse(r); } catch { return r; }
    };
    const resolve = (v: any, depth = 0): any => {
        if (depth > 6) return v;
        if (typeof v === 'string' && /^\$[0-9a-f]+$/.test(v)) return resolve(val(v.slice(1)), depth + 1);
        if (Array.isArray(v)) return v.map(x => resolve(x, depth + 1));
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x, depth + 1)]));
        return v;
    };

    const out: EventSuggestion[] = [];
    const seen = new Set<string>();
    for (const id of rows.keys()) {
        const raw = val(id);
        if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !raw.slug || !raw.startDate || seen.has(raw.slug)) continue;
        seen.add(raw.slug);
        const e = resolve(raw);
        const start = toIsoDate(e.startDate);
        const end = toIsoDate(e.endDate);
        if (!start) continue;
        const loc = e.location && typeof e.location === 'object' ? e.location : {};
        const country = (loc.countryCode && COUNTRY_DE?.of(String(loc.countryCode).toUpperCase())) || '';
        const location = [loc.venue, loc.city, country].filter(x => typeof x === 'string' && x && x !== 'TBD').join(', ');
        const desc = typeof e.description === 'string' ? e.description : (e.description?.de || e.description?.en || '');
        const disciplines = Array.isArray(e.disciplines) ? e.disciplines.join(', ') : '';
        const series = typeof e.series === 'string' && e.series !== e.name ? e.series : '';
        out.push(makeSuggestion({
            title: `${e.name || ''}${series && !String(e.name).includes(series) ? ` (${series})` : ''}`,
            startDateUtc: start,
            endDateUtc: end && end > start ? end : undefined,
            location,
            link: typeof e.officialUrl === 'string' && e.officialUrl ? e.officialUrl : `https://skateboardeventcalendar.com/de/events/${e.slug}/`,
            description: [desc, disciplines && `Disziplin: ${disciplines}`].filter(Boolean).join(' · '),
            flyerUrl: '',
            source: 'Skateboard Event Calendar',
            confidence: 'hoch',
            // Europa-Angabe der Seite selbst, falls der Ort unbekannt ist
            ...(loc.continent ? { continent: String(loc.continent) } : {}),
        } as any));
    }
    return out;
}

/** Kalender-/Contest-Seiten, die bei jedem Scan direkt durchsucht werden. */
export const DEFAULT_EVENT_PAGES = [
    'https://belgianskateleague.be/nl/belgian-skate-league',
    'https://skateboarddeutschland.de/category/contests/',
    'https://skateboarddeutschland.de/category/wettbewerbe/',
    'https://skatejam.net/',
    'https://www.interskate.de/',
    'https://skateresults.app/',
    'https://www.kehl.de/skatecontest',
];

async function scanPages(urls: string[]): Promise<EventSuggestion[]> {
    const results = await mapLimit(urls, 5, u =>
        eventsFromPage(u, `Kalender (${new URL(u).hostname.replace(/^www\./, '')})`).catch(() => [] as EventSuggestion[])
    );
    return results.flat();
}

function searchQueries(): string[] {
    // Bings RSS-Suche versteht nur einfache Begriffe; bei "skate ..." kommen sonst
    // Videospiel-Seiten. Zusammengesetzte Wörter (wie Hashtags) funktionieren gut.
    const now = new Date();
    const years = [now.getFullYear()];
    if (now.getMonth() >= 8) years.push(now.getFullYear() + 1); // ab September auch nächstes Jahr
    const terms = [
        'skatecontest', 'skatejam', 'bowljam', 'miniramp-contest', 'skateboardcontest',
        'skatemeisterschaft', 'skateboard-meisterschaft', 'skatefestival', 'skatecup', 'skateboardcup',
        'skateevent', 'skatecompetition', 'go skateboarding day', 'concours-skate', 'skatewedstrijd',
        'campeonato-skate', 'skateboard championship', 'skatepark-eröffnung',
    ];
    const queries = new Set<string>(terms);
    for (const y of years) {
        for (const t of ['skatecontest', 'skatejam', 'bowljam', 'skateboardcontest', 'skatemeisterschaft', 'skatefestival', 'skatecup']) {
            queries.add(`${t} ${y}`);
        }
    }
    return [...queries];
}

type SearchHit = { title: string; link: string; snippet: string };

async function bingSearch(query: string): Promise<SearchHit[]> {
    const url = `https://www.bing.com/search?format=rss&count=20&q=${encodeURIComponent(query)}`;
    const xml = await fetchText(url, 10000);
    const $ = cheerio.load(xml, { xmlMode: true });
    return $('item').map((_, el) => ({
        title: $(el).find('title').text().trim(),
        link: $(el).find('link').text().trim(),
        snippet: $(el).find('description').text().trim(),
    })).get();
}

async function scanWeb(maxPages: number): Promise<EventSuggestion[]> {
    const queries = searchQueries();
    const hitLists = await mapLimit(queries, 4, q => bingSearch(q).catch(() => [] as SearchHit[]));

    // Ergebnisse zusammenführen, offensichtlichen Müll vorab aussortieren
    const seen = new Set<string>();
    const hits: SearchHit[] = [];
    for (const list of hitLists) {
        for (const h of list) {
            const key = normalizeUrl(h.link);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            if (EXCLUDE_RE.test(`${h.title} ${h.link}`)) continue;
            if (!SKATE_RE.test(`${h.title} ${h.snippet} ${h.link}`)) continue;
            if (/theboardr\.com|skateboard-germany\.de|blue-tomato\.com|skateboardeventcalendar\.com/.test(h.link)) continue; // eigene Quellen
            if (DEFAULT_EVENT_PAGES.some(p => normalizeUrl(p) === key)) continue;               // feste Kalender-Seiten
            hits.push(h);
        }
    }

    // Treffer mit Datum im Snippet zuerst, dann europäische Domains
    const score = (h: SearchHit) => (firstFutureDate(`${h.title} ${h.snippet}`) ? 2 : 0) + (isEuropeanTld(h.link) ? 1 : 0);
    hits.sort((a, b) => score(b) - score(a));

    console.log(`[event-scan] ${queries.length} Suchen, ${hitLists.flat().length} Treffer, ${hits.length} relevante Seiten`);
    const pages = await mapLimit(hits.slice(0, maxPages), 6, h =>
        eventsFromPage(h.link, `Websuche (${new URL(h.link).hostname.replace(/^www\./, '')})`, { title: h.title, snippet: h.snippet })
            .catch(() => [] as EventSuggestion[])
    );
    return pages.flat().map(e => ({
        ...e,
        // Ort unbekannt, aber europäische Domain → als Europa werten
        location: e.location || (isEuropeanTld(e.link) ? '' : e.location),
    }));
}

// ---------------------------------------------------------------------------
// Hauptfunktion
// ---------------------------------------------------------------------------

function isDuplicateEvent(a: { title: string; link?: string; startDateUtc?: string }, b: { title: string; link?: string; startDateUtc?: string; date?: string }): boolean {
    const la = normalizeUrl(a.link);
    const lb = normalizeUrl(b.link);
    const sameDay = (() => {
        const da = a.startDateUtc;
        const db = b.startDateUtc || toIsoDate(b.date);
        if (!da || !db) return false;
        return Math.abs(new Date(da).getTime() - new Date(db).getTime()) <= 3 * 86400000;
    })();
    // Gleicher Link + gleiches Datum (ein Kalender-Link kann mehrere Events haben)
    if (la && la === lb && (sameDay || !b.startDateUtc)) return true;
    if (sameDay && similarTitles(a.title, b.title)) return true;
    return false;
}

export type ScanResult = {
    events: EventSuggestion[];
    stats: Record<string, number>;
    errors: string[];
};

export async function scanSkateEvents(
    existing: any[] = [],
    options: { maxWebPages?: number; extraPages?: string[]; today?: string; international?: boolean } = {}
): Promise<ScanResult> {
    todayOverride = options.today && /^\d{4}-\d{2}-\d{2}$/.test(options.today) ? options.today : '';
    const errors: string[] = [];
    const run = async (name: string, fn: () => Promise<EventSuggestion[]>) => {
        try {
            return await fn();
        } catch (e) {
            errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
            return [];
        }
    };

    const all = (await Promise.all([
        run('The Boardr', scanBoardr),
        run('Skateboard Germany', scanSkateboardGermany),
        run('Blue Tomato', scanBlueTomato),
        run('Skateboard Event Calendar', scanSkateboardEventCalendar),
        run('Kalender-Seiten', () => scanPages([...new Set([...DEFAULT_EVENT_PAGES, ...(options.extraPages || [])])])),
        run('Websuche', () => scanWeb(options.maxWebPages ?? 70)),
    ])).flat();

    const today = todayIso();
    const result: EventSuggestion[] = [];
    for (const e of all) {
        if (!e.title || e.title.length < 4 || GENERIC_TITLE_RE.test(e.title) || !e.startDateUtc) continue;
        if (EXCLUDE_RE.test(e.title)) continue;
        if ((e.endDateUtc || e.startDateUtc) < today) continue;                  // vorbei
        // Erst Ort, dann Titel prüfen ("World Skate Tour, Japan" mit Ort "Kitakyushu")
        const continent = (e as any).continent as string | undefined;
        const europe = continent ? continent === 'europe' : (europeCheck(e.location) ?? (europeCheck(e.title) === false ? false : null));
        // International: große Contests außerhalb Europas nur aus verlässlichen Kalendern
        // (Websuche-Treffer außerhalb Europas sind zu ungenau)
        const trustedWorldwide = options.international && (e.source === 'The Boardr' || e.source === 'Skateboard Germany' || e.source === 'Skateboard Event Calendar');
        delete (e as any).continent;
        if (europe === false && !trustedWorldwide) continue;                      // außerhalb Europas
        if (europe === null && !trustedWorldwide && !isEuropeanTld(e.link) && e.source !== 'Skateboard Germany') continue;
        if (!isSkateEvent(e.title, e.description) && e.confidence !== 'hoch') continue;
        if (existing.some(x => isDuplicateEvent(e, x))) continue;                // schon im Kalender
        if (result.some(x => isDuplicateEvent(e, x))) continue;                  // schon gefunden
        result.push(e);
    }

    result.sort((a, b) => a.startDateUtc.localeCompare(b.startDateUtc));
    const stats: Record<string, number> = {};
    for (const e of result) {
        const key = e.source.startsWith('Websuche') ? 'Websuche' : e.source.startsWith('Kalender') ? 'Kalender-Seiten' : e.source;
        stats[key] = (stats[key] || 0) + 1;
    }
    return { events: result, stats, errors };
}
