// Auto-Posts: Neue Spots, Skateparks und Skateshops auf der Skatemap und neue Events im
// Kalender werden als Vorschläge gesammelt (src/data/auto-candidates.json, nur lokal).
// Im Admin Dashboard (Reiter „Auto-Posts“) wählst du aus, was davon ein Beitrag werden soll.
//
// Erstellte Beiträge landen in src/data/posts.json und sind damit sofort auf der lokalen
// Startseite (localhost) zu sehen. Online gehen sie erst mit „Publish to Git“.
//
// Reines JavaScript, damit es sowohl scripts/import-maps.mjs als auch die
// API-Routen (TypeScript) nutzen können.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const POSTS_FILE = path.join(ROOT, 'src', 'data', 'posts.json');
const QUEUE_FILE = path.join(ROOT, 'src', 'data', 'auto-candidates.json');
const IMG_DIR = path.join(ROOT, 'public', 'uploads', 'posts', 'auto');
const IMG_URL = '/uploads/posts/auto';
const UA = 'CurbsideMagazine/1.0 (curbside.sortelba.com)';

const TYPE = {
    park: { color: '#2563eb', de: 'Skatepark', dePl: 'Skateparks', en: 'skatepark', enPl: 'skateparks' },
    spot: { color: '#f97316', de: 'Street-Spot', dePl: 'Street-Spots', en: 'street spot', enPl: 'street spots' },
    shop: { color: '#16a34a', de: 'Skateshop', dePl: 'Skateshops', en: 'skate shop', enPl: 'skate shops' },
};
const TYPE_ORDER = ['park', 'spot', 'shop'];
const EVENT_COLOR = '#e11d48';
/** So viele Einträge werden im Beitrag namentlich aufgezählt */
const LIST_MAX = 30;

// ---------- Hilfen ----------

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const clip = (s, n) => { const t = String(s || '').trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
const excerpt = (s) => clip(String(s || '').replace(/\s+/g, ' '), 200);
const postDate = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const newId = () => `post_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const join = (arr, and) => (arr.length > 1 ? `${arr.slice(0, -1).join(', ')} ${and} ${arr[arr.length - 1]}` : arr[0] || '');

function readJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
const readPosts = () => readJson(POSTS_FILE, []);

/** Stadt zu Koordinaten (OpenStreetMap), z. B. „Karlsruhe“ */
async function reverseCity(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=12&accept-language=de&lat=${lat}&lon=${lng}`, {
            headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000),
        });
        const a = (await res.json())?.address || {};
        return a.city || a.town || a.village || a.municipality || a.county || '';
    } catch {
        return '';
    }
}

/** Fehlende Städte nachschlagen (höchstens `max`, 1 Anfrage pro Sekunde) */
async function fillCities(items, max = 15) {
    let n = 0;
    for (const it of items) {
        if (it.city || n >= max) continue;
        if (n++) await sleep(1100);
        it.city = await reverseCity(it.lat, it.lng);
    }
}

/** Satz mit Wortumbruch auf mehrere Zeilen verteilen (für die Bilder) */
function wrap(text, maxChars, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
        if ((line + ' ' + w).trim().length > maxChars && line) { lines.push(line); line = w; }
        else line = (line + ' ' + w).trim();
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
        lines.length = maxLines;
        lines[maxLines - 1] = clip(lines[maxLines - 1], maxChars - 1) + (lines[maxLines - 1].endsWith('…') ? '' : '…');
    }
    return lines;
}

// ---------- Vorschläge (Warteschlange) ----------

function readQueue() {
    const q = readJson(QUEUE_FILE, {});
    return { map: Array.isArray(q.map) ? q.map : [], events: Array.isArray(q.events) ? q.events : [] };
}
function writeQueue(q) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2) + '\n');
}

/** Refs, die schon in einem Beitrag stecken */
function postedRefs() {
    const refs = new Set();
    for (const p of readPosts()) for (const r of p.auto?.refs || []) refs.add(r);
    return refs;
}

const mapRef = (p) => `${p.type}:${Number(p.lat).toFixed(4)},${Number(p.lng).toFixed(4)}`;
const endDate = (e) => {
    const m = String(e.date || '').match(/-\s*(\d{2})\.(\d{2})\.(\d{4})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : String(e.startDateUtc || '').slice(0, 10);
};
const isPast = (e) => { const end = endDate(e); return Boolean(end) && end < today(); };

/**
 * Neue Map-Einträge als Vorschläge merken.
 * items: { name, type: 'spot'|'park'|'shop', lat, lng, address?, description?, hours?, url?, ref? }
 */
export function queueMapItems(items, source = '') {
    const q = readQueue();
    const known = new Set([...postedRefs(), ...q.map.map((c) => c.ref)]);
    let added = 0;
    for (const s of items) {
        if (!s?.name || !Number.isFinite(Number(s.lat)) || !Number.isFinite(Number(s.lng))) continue;
        const ref = s.ref || `map:${mapRef(s)}`;
        if (known.has(ref)) continue;
        known.add(ref);
        q.map.push({
            ref, name: s.name, type: TYPE[s.type] ? s.type : 'spot', lat: Number(s.lat), lng: Number(s.lng),
            ...(s.address ? { address: s.address } : {}), ...(s.description ? { description: s.description } : {}),
            ...(s.hours ? { hours: s.hours } : {}), ...(s.url ? { url: s.url } : {}),
            source, added: new Date().toISOString(),
        });
        added++;
    }
    if (added) writeQueue(q);
    return added;
}

/** Neue Events als Vorschläge merken (vergangene nicht) */
export function queueEvents(events) {
    const q = readQueue();
    const known = new Set([...postedRefs(), ...q.events.map((c) => c.ref)]);
    let added = 0;
    for (const e of events) {
        if (!e?.id || !e.title || isPast(e)) continue;
        const ref = `event:${e.id}`;
        if (known.has(ref)) continue;
        known.add(ref);
        q.events.push({
            ref, id: e.id, title: e.title, date: e.date || '', startDateUtc: e.startDateUtc || '', location: e.location || '',
            link: e.link || '', description: e.description || '', flyerUrl: e.flyerUrl || '', added: new Date().toISOString(),
        });
        added++;
    }
    if (added) writeQueue(q);
    return added;
}

/** Offene Vorschläge (Events, die inzwischen vorbei sind, fallen raus) */
export function listCandidates() {
    const q = readQueue();
    const events = q.events.filter((e) => !isPast(e));
    if (events.length !== q.events.length) writeQueue({ ...q, events });
    return { map: q.map, events };
}

/** Vorschläge verwerfen */
export function dismissCandidates(refs) {
    const drop = new Set(refs);
    const q = readQueue();
    writeQueue({ map: q.map.filter((c) => !drop.has(c.ref)), events: q.events.filter((c) => !drop.has(c.ref)) });
}

// ---------- Bilder ----------

const W = 1200, H = 630;
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";
/** Breite eines Labels (20 px fett, Großbuchstaben, 2 px Sperrung) inkl. Innenabstand */
const badgeWidth = (text) => Math.round(36 + [...String(text)].reduce((w, c) => w + (c === ' ' ? 8 : /[·.,:]/.test(c) ? 9 : /[MW]/.test(c) ? 20 : /[I]/.test(c) ? 8 : 16), 0));

const project = (lat, lng, zoom) => {
    const n = 2 ** zoom * 256;
    const rad = (lat * Math.PI) / 180;
    return { x: ((lng + 180) / 360) * n, y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n };
};

/** OpenStreetMap-Ausschnitt (W×H) mit linker oberer Ecke bei Pixel (left, top), oder null */
async function tiles(left, top, zoom) {
    const n = 2 ** zoom;
    const jobs = [];
    for (let x = Math.floor(left / 256); x <= Math.floor((left + W - 1) / 256); x++) {
        for (let y = Math.floor(top / 256); y <= Math.floor((top + H - 1) / 256); y++) {
            if (y < 0 || y >= n) continue;
            jobs.push((async () => {
                const res = await fetch(`https://tile.openstreetmap.org/${zoom}/${((x % n) + n) % n}/${y}.png`, {
                    headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000),
                });
                if (!res.ok) throw new Error(`Kachel ${res.status}`);
                return { input: Buffer.from(await res.arrayBuffer()), left: x * 256 - left, top: y * 256 - top };
            })());
        }
    }
    try {
        const parts = [];
        for (const t of await Promise.all(jobs)) {
            // Kacheln, die über den Rand hinausragen, passend zuschneiden
            const cl = Math.max(0, -t.left), ct = Math.max(0, -t.top);
            const w = Math.min(256 - cl, W - Math.max(0, t.left)), h = Math.min(256 - ct, H - Math.max(0, t.top));
            if (w <= 0 || h <= 0) continue;
            parts.push({ input: await sharp(t.input).extract({ left: cl, top: ct, width: w, height: h }).png().toBuffer(), left: Math.max(0, t.left), top: Math.max(0, t.top) });
        }
        return await sharp({ create: { width: W, height: H, channels: 3, background: '#aad3df' } }).composite(parts).png().toBuffer();
    } catch {
        return null;
    }
}

const pinSvg = (x, y, color, s = 1) => `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})">
    <ellipse cx="0" cy="4" rx="16" ry="6" fill="rgba(0,0,0,.35)"/>
    <path d="M0 0 C -6 -18 -30 -34 -30 -58 A 30 30 0 1 1 30 -58 C 30 -34 6 -18 0 0 Z" fill="${color}" stroke="#fff" stroke-width="5"/>
    <circle cx="0" cy="-58" r="11" fill="#fff"/></g>`;

/**
 * Kartenbild mit Pins für einen oder mehrere Punkte + dunkle Leiste unten.
 * Gibt { url, center, zoom } zurück (center/zoom für den Link auf die Skatemap).
 */
async function mapImage(points, { badge, color, title, sub }, fileBase) {
    const titleLines = wrap(title, 32, 2);
    const barTop = H - (titleLines.length > 1 ? 230 : 180);
    // Größten Zoom wählen, bei dem alle Pins in den sichtbaren Bereich über der Leiste passen
    const areaW = W - 200, areaH = barTop - 110;
    let zoom = 15, px = [];
    for (; zoom >= 3; zoom--) {
        px = points.map((p) => project(p.lat, p.lng, zoom));
        const xs = px.map((p) => p.x), ys = px.map((p) => p.y);
        if (Math.max(...xs) - Math.min(...xs) <= areaW && Math.max(...ys) - Math.min(...ys) <= areaH) break;
    }
    const xs = px.map((p) => p.x), ys = px.map((p) => p.y);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2, midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const left = Math.round(midX - W / 2), top = Math.round(midY - (70 + (barTop - 20)) / 2);
    const bg = await tiles(left, top, zoom);
    const scale = points.length > 12 ? 0.45 : points.length > 1 ? 0.65 : 1;
    // Mittelpunkt zurückrechnen (für ?at= auf der Skatemap)
    const n = 2 ** zoom * 256;
    const lng = (midX / n) * 360 - 180;
    const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * midY) / n))) * 180) / Math.PI;

    const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${bg ? '' : `<rect width="${W}" height="${H}" fill="#09090b"/>
  <g stroke="#27272a" stroke-width="2">${Array.from({ length: 14 }, (_, i) => `<line x1="${i * 90}" y1="0" x2="${i * 90 - 300}" y2="${H}"/>`).join('')}</g>`}
  ${bg ? [...points.keys()].sort((a, b) => px[a].y - px[b].y).map((i) => pinSvg(px[i].x - left, px[i].y - top, TYPE[points[i].type]?.color || color, scale)).join('') : ''}
  <rect x="0" y="${barTop}" width="${W}" height="${H - barTop}" fill="#09090b" fill-opacity="${bg ? 0.92 : 1}"/>
  <rect x="60" y="${barTop + 34}" width="${badgeWidth(badge)}" height="36" rx="18" fill="${color}"/>
  <text x="78" y="${barTop + 59}" font-family="${FONT}" font-size="20" font-weight="800" fill="#fff" letter-spacing="2">${esc(badge)}</text>
  ${titleLines.map((l, i) => `<text x="60" y="${barTop + 122 + i * 54}" font-family="${FONT}" font-size="50" font-weight="900" font-style="italic" fill="#fafafa">${esc(l)}</text>`).join('')}
  ${sub ? `<text x="60" y="${H - 26}" font-family="${FONT}" font-size="22" fill="#a1a1aa">${esc(clip(sub, 75))}</text>` : ''}
  <text x="${W - 60}" y="${H - 26}" text-anchor="end" font-family="${FONT}" font-size="22" font-weight="900" font-style="italic" fill="#fafafa">CURBSIDE</text>
  ${bg ? `<text x="${W - 10}" y="18" text-anchor="end" font-family="${FONT}" font-size="12" fill="#3f3f46">© OpenStreetMap</text>` : ''}
</svg>`;
    const base = bg || (await sharp({ create: { width: W, height: H, channels: 3, background: '#09090b' } }).png().toBuffer());
    const url = saveImage(await sharp(base).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 82 }).toBuffer(), fileBase);
    return { url, center: { lat, lng }, zoom };
}

/** Dunkle Karte mit Überschrift und Liste (Events ohne Flyer, Events-Sammelpost) */
async function listImage({ label, color, title, lines, footer }, fileBase) {
    const titleLines = wrap(title, 30, 2);
    const listTop = 170 + titleLines.length * 62;
    const rows = lines.slice(0, Math.max(1, Math.floor((H - listTop - 70) / 40)));
    const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#09090b"/>
  <rect x="0" y="0" width="14" height="${H}" fill="${color}"/>
  <rect x="60" y="60" width="${badgeWidth(label)}" height="40" rx="20" fill="${color}"/>
  <text x="78" y="88" font-family="${FONT}" font-size="20" font-weight="800" fill="#fff" letter-spacing="2">${esc(label.toUpperCase())}</text>
  ${titleLines.map((l, i) => `<text x="60" y="${178 + i * 62}" font-family="${FONT}" font-size="56" font-weight="900" font-style="italic" fill="#fafafa">${esc(l)}</text>`).join('')}
  ${rows.map((l, i) => `<text x="60" y="${listTop + 30 + i * 40}" font-family="${FONT}" font-size="26" fill="#d4d4d8">${esc(clip(l, 72))}</text>`).join('')}
  ${footer ? `<text x="60" y="${H - 40}" font-family="${FONT}" font-size="22" fill="#a1a1aa">${esc(clip(footer, 70))}</text>` : ''}
  <text x="${W - 60}" y="${H - 40}" text-anchor="end" font-family="${FONT}" font-size="24" font-weight="900" font-style="italic" fill="#fafafa">CURBSIDE</text>
</svg>`;
    return saveImage(await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer(), fileBase);
}

/** Flyer eines Events lokal speichern (fremde Links laufen sonst irgendwann ab) */
async function downloadFlyer(url, fileBase) {
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
        if (!res.ok) return null;
        const buf = await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
        return saveImage(buf, fileBase);
    } catch {
        return null;
    }
}

function saveImage(buf, fileBase) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    const name = `${fileBase.replace(/[^\w-]+/g, '-').slice(0, 60)}.jpg`;
    fs.writeFileSync(path.join(IMG_DIR, name), buf);
    return `${IMG_URL}/${name}`;
}

// ---------- Beiträge bauen ----------

function basePost({ id, de, en, image, link, tags, kind, refs }) {
    return {
        id,
        title: de.title,
        description: excerpt(de.content),
        translations: { de, en },
        type: 'image',
        content: image,
        media: { images: [image], videoUrl: '', externalLink: link },
        source: 'CURBSIDE',
        date: postDate(),
        tags,
        status: 'published',
        auto: { kind, refs, created: new Date().toISOString() },
    };
}

const mapLink = (c, zoom) => `/skatemap/?at=${c.lat.toFixed(5)},${c.lng.toFixed(5)}&z=${Math.max(5, Math.min(16, zoom + 1))}`;

/** Ein einzelner neuer Spot/Park/Shop */
async function singleMapPost(spot) {
    const t = TYPE[spot.type] || TYPE.spot;
    const where = spot.city ? ` in ${spot.city}` : '';
    const id = newId();
    const img = await mapImage([spot], {
        badge: `NEU AUF DER SKATEMAP · ${t.de.toUpperCase()}`, color: t.color, title: spot.name,
        sub: [spot.city, spot.address && spot.address !== spot.city ? spot.address : ''].filter(Boolean).join(' · '),
    }, `${spot.type}-${spot.name}-${id.slice(-6)}`);
    const infoDe = [], infoEn = [];
    if (spot.description) { infoDe.push(spot.description); infoEn.push(spot.description); }
    if (spot.address) { infoDe.push(`Adresse: ${spot.address}`); infoEn.push(`Address: ${spot.address}`); }
    if (spot.hours) { infoDe.push(`Öffnungszeiten: ${spot.hours}`); infoEn.push(`Opening hours: ${spot.hours}`); }
    if (spot.type === 'shop' && spot.url && !/google\.[a-z.]+\/maps/.test(spot.url)) { infoDe.push(`Website: ${spot.url}`); infoEn.push(`Website: ${spot.url}`); }
    const de = {
        title: `Neu auf der Skatemap: ${spot.name}`,
        content: [
            `Yo Leute, die CURBSIDE Skatemap hat Zuwachs bekommen! Neu dabei: ${spot.type === 'shop' ? 'der Skateshop' : spot.type === 'park' ? 'der Skatepark' : 'der Street-Spot'} ${spot.name}${where}.`,
            infoDe.join('\n'),
            spot.type === 'shop'
                ? 'Auf der Skatemap siehst du, wo der Shop liegt. Support your local skate shop!'
                : 'Auf der Skatemap siehst du, wo genau du hin musst. Schnapp dir dein Board und check es aus!',
            'Du kennst einen Spot, Park oder Shop, der noch fehlt? Über „Eintragen“ auf der Skatemap kannst du ihn uns schicken.',
        ].filter(Boolean).join('\n\n'),
    };
    const en = {
        title: `New on the Skatemap: ${spot.name}`,
        content: [
            `Yo people, the CURBSIDE Skatemap just got bigger! New: the ${t.en} ${spot.name}${where}.`,
            infoEn.join('\n'),
            spot.type === 'shop'
                ? 'Check the Skatemap to see where the shop is. Support your local skate shop!'
                : 'Check the Skatemap to see exactly where it is. Grab your board and go skate it!',
            'Know a spot, park or shop that is missing? Send it to us via “Add” on the Skatemap.',
        ].filter(Boolean).join('\n\n'),
    };
    return basePost({ id, de, en, image: img.url, link: mapLink(img.center, Math.min(img.zoom, 15)), tags: ['Skatemap', t.de, ...(spot.city ? [spot.city] : [])], kind: spot.type, refs: [spot.ref] });
}

/** Mehrere neue Einträge → ein „Skatemap wurde aktualisiert“-Beitrag */
async function summaryMapPost(spots) {
    const byType = TYPE_ORDER.map((k) => [k, spots.filter((s) => s.type === k)]).filter(([, l]) => l.length);
    const countDe = byType.map(([k, l]) => `${l.length} ${l.length === 1 ? TYPE[k].de : TYPE[k].dePl}`);
    const countEn = byType.map(([k, l]) => `${l.length} ${l.length === 1 ? TYPE[k].en : TYPE[k].enPl}`);
    // Häufigste Orte zuerst
    const cityCount = new Map();
    for (const s of spots) if (s.city) cityCount.set(s.city, (cityCount.get(s.city) || 0) + 1);
    const cities = [...cityCount.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const topCities = cities.slice(0, 6);
    const moreCities = cities.length - topCities.length;
    const regionDe = topCities.length ? ` – unter anderem in ${join(topCities, 'und')}${moreCities > 0 ? ` und ${moreCities} weiteren Orten` : ''}` : '';
    const regionEn = topCities.length ? ` – including ${join(topCities, 'and')}${moreCities > 0 ? ` and ${moreCities} more places` : ''}` : '';

    let listed = 0;
    const section = (lang) => byType.map(([k, l]) => {
        const rows = [];
        for (const s of l) {
            if (listed >= LIST_MAX) break;
            rows.push(`• ${s.name}${s.city && !s.name.includes(s.city) ? ` (${s.city})` : ''}`);
            listed++;
        }
        return rows.length ? `${lang === 'de' ? TYPE[k].dePl : TYPE[k].enPl.replace(/^./, (c) => c.toUpperCase())}:\n${rows.join('\n')}` : '';
    }).filter(Boolean).join('\n\n');
    const listDe = section('de'); listed = 0;
    const listEn = section('en');
    const rest = spots.length - Math.min(spots.length, LIST_MAX);

    const id = newId();
    const img = await mapImage(spots, {
        badge: 'SKATEMAP UPDATE', color: '#2563eb', title: `${spots.length} neue Einträge auf der Skatemap`,
        sub: [join(countDe, 'und'), topCities.slice(0, 3).join(', ')].filter(Boolean).join(' · '),
    }, `skatemap-update-${id.slice(-6)}`);

    const de = {
        title: `Skatemap-Update: ${join(countDe, 'und')} neu`,
        content: [
            `Yo Leute, die CURBSIDE Skatemap wurde aktualisiert! Neu dabei sind ${join(countDe, 'und')}${regionDe}.`,
            listDe + (rest ? `\n\n… und ${rest} weitere` : ''),
            'Öffne die Skatemap und check, was in deiner Gegend neu ist. Fehlt noch was? Über „Eintragen“ auf der Skatemap kannst du es uns schicken.',
        ].join('\n\n'),
    };
    const en = {
        title: `Skatemap update: ${join(countEn, 'and')} added`,
        content: [
            `Yo people, the CURBSIDE Skatemap just got updated! New: ${join(countEn, 'and')}${regionEn}.`,
            listEn + (rest ? `\n\n… and ${rest} more` : ''),
            'Open the Skatemap and see what is new near you. Something missing? Send it to us via “Add” on the Skatemap.',
        ].join('\n\n'),
    };
    return basePost({ id, de, en, image: img.url, link: mapLink(img.center, img.zoom), tags: ['Skatemap', 'Update', ...topCities.slice(0, 3)], kind: 'map-summary', refs: spots.map((s) => s.ref) });
}

async function singleEventPost(ev) {
    const id = newId();
    const image = (ev.flyerUrl && (await downloadFlyer(ev.flyerUrl, `event-${ev.id}`))) || (await listImage({
        label: 'Neues Event', color: EVENT_COLOR, title: ev.title,
        lines: [ev.date && `Wann: ${ev.date}`, ev.location && `Wo: ${ev.location}`].filter(Boolean),
        footer: 'Alle Events im CURBSIDE Kalender',
    }, `event-${ev.id}`));
    const desc = String(ev.description || '').trim();
    const de = {
        title: `Neues Event im Kalender: ${ev.title}`,
        content: [
            `Yo Leute, neues Event im CURBSIDE Kalender: ${ev.title}!`,
            [ev.date && `Wann: ${ev.date}`, ev.location && `Wo: ${ev.location}`].filter(Boolean).join('\n'),
            desc,
            ev.link ? `Alle Infos: ${ev.link}` : '',
            'Weitere Contests, Jams und Sessions findest du im Kalender auf der Startseite.',
        ].filter(Boolean).join('\n\n'),
    };
    const en = {
        title: `New event in the calendar: ${ev.title}`,
        content: [
            `Yo people, new event in the CURBSIDE calendar: ${ev.title}!`,
            [ev.date && `When: ${ev.date}`, ev.location && `Where: ${ev.location}`].filter(Boolean).join('\n'),
            desc,
            ev.link ? `All info: ${ev.link}` : '',
            'Find more contests, jams and sessions in the calendar on the homepage.',
        ].filter(Boolean).join('\n\n'),
    };
    const city = String(ev.location || '').split(',')[0].trim();
    return basePost({ id, de, en, image, link: ev.link || '/', tags: ['Events', ...(city ? [city] : [])], kind: 'event', refs: [ev.ref] });
}

async function summaryEventPost(events) {
    const sorted = [...events].sort((a, b) => String(a.startDateUtc || '').localeCompare(String(b.startDateUtc || '')));
    const line = (e) => `• ${e.date ? `${e.date}: ` : ''}${e.title}${e.location ? ` (${e.location})` : ''}`;
    const list = sorted.slice(0, LIST_MAX).map(line).join('\n');
    const rest = sorted.length - Math.min(sorted.length, LIST_MAX);
    const id = newId();
    const image = await listImage({
        label: 'Neue Events', color: EVENT_COLOR, title: `${events.length} neue Events im Kalender`,
        lines: sorted.map((e) => `• ${e.date ? `${e.date.split(' ')[0]}  ` : ''}${e.title}`), footer: 'Contests, Jams & Sessions',
    }, `events-update-${id.slice(-6)}`);
    const de = {
        title: `${events.length} neue Events im Kalender`,
        content: [
            `Yo Leute, frisch im CURBSIDE Event-Kalender – ${events.length} neue Termine:`,
            list + (rest ? `\n… und ${rest} weitere` : ''),
            'Alle Details findest du im Kalender auf der Startseite.',
        ].join('\n\n'),
    };
    const en = {
        title: `${events.length} new events in the calendar`,
        content: [
            `Yo people, fresh in the CURBSIDE event calendar – ${events.length} new dates:`,
            list + (rest ? `\n… and ${rest} more` : ''),
            'Find all the details in the calendar on the homepage.',
        ].join('\n\n'),
    };
    return basePost({ id, de, en, image, link: '/', tags: ['Events', 'Update'], kind: 'event-summary', refs: events.map((e) => e.ref) });
}

/**
 * Aus ausgewählten Vorschlägen EINEN Beitrag bauen und oben in posts.json speichern.
 * kind: 'map' | 'events'. Die verwendeten Vorschläge verschwinden aus der Liste.
 */
export async function createPostFromCandidates(kind, refs) {
    const want = new Set(refs);
    const q = readQueue();
    const list = kind === 'events' ? q.events : q.map;
    const picked = list.filter((c) => want.has(c.ref));
    if (!picked.length) throw new Error('Keine Einträge ausgewählt.');

    let post;
    if (kind === 'events') {
        post = picked.length === 1 ? await singleEventPost(picked[0]) : await summaryEventPost(picked);
    } else {
        await fillCities(picked);
        post = picked.length === 1 ? await singleMapPost(picked[0]) : await summaryMapPost(picked);
    }
    fs.writeFileSync(POSTS_FILE, JSON.stringify([post, ...readPosts()], null, 2));
    dismissCandidates(picked.map((c) => c.ref));
    return post;
}

/** Auto-Beitrag samt erzeugtem Bild löschen */
export function deleteAutoPost(id) {
    const posts = readPosts();
    const post = posts.find((p) => p.id === id && p.auto);
    if (!post) return false;
    const rest = posts.filter((p) => p !== post);
    fs.writeFileSync(POSTS_FILE, JSON.stringify(rest, null, 2));
    for (const img of post.media?.images || []) {
        if (typeof img === 'string' && img.startsWith(`${IMG_URL}/`)) {
            const file = path.join(ROOT, 'public', img);
            if (!rest.some((p) => JSON.stringify(p).includes(img)) && fs.existsSync(file)) fs.unlinkSync(file);
        }
    }
    return true;
}
