// Holt alle Spots, Skateparks und Shops aus deinen Google-Karten und baut daraus
// src/data/map.json (die Skatemap auf der Community-Seite).
//
// Aufruf:  node scripts/import-maps.mjs
//
// Quellen stehen in src/data/map-extra.json ("sources"). Doppelte Einträge (gleicher Ort, auch aus
// verschiedenen Karten) werden zusammengefasst. Shops, die schon bei
// "Support Skate Shops" (community.json) stehen, werden nicht doppelt eingetragen.
// Im Admin ausgeblendete Punkte ("hidden": true) bleiben beim erneuten Import ausgeblendet.
//
// Spots, die du Claude schickst, stehen in src/data/map-extra.json und kommen immer mit
// auf die Karte. Sobald du sie auch in My Maps einträgst, erkennt der Import sie als
// Dublette. Neue Spots für My Maps exportieren: node scripts/export-kml.mjs --neu
import fs from 'node:fs';
import path from 'node:path';

// Die Quellen (Google-Listen und My-Maps-Karten) stehen in src/data/map-extra.json
// unter "sources" und lassen sich im Admin-Dashboard (Community → Skatemap) bearbeiten.

// Ordner in der My-Maps-Karte → Kategorie (null = überspringen)
function folderType(name) {
    const n = name.toLowerCase();
    if (n.includes('shop')) return 'shop';
    if (n.includes('park')) return 'park';
    if (n.startsWith('trasa') || n.startsWith('routebeschrijving') || n.startsWith('route')) return 'route';
    return 'spot';
}

const ROOT = process.cwd();
const MAP_FILE = path.join(ROOT, 'src', 'data', 'map.json');
const COMMUNITY_FILE = path.join(ROOT, 'src', 'data', 'community.json');
const EXTRA_FILE = path.join(ROOT, 'src', 'data', 'map-extra.json');
export const MANUAL_LABEL = 'Von dir geschickt';
const EXTRA = fs.existsSync(EXTRA_FILE) ? JSON.parse(fs.readFileSync(EXTRA_FILE, 'utf8')) : {};
const SOURCES = EXTRA.sources || [];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Quellen laden ----------

async function loadList(id) {
    // Google liefert die Liste manchmal leer aus → ein paar Versuche
    for (let i = 0; i < 6; i++) {
        const variant = i % 2 ? '2e2' : '2e1';
        const url = `https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=de&gl=de&pb=!1m4!1s${id}!${variant}!3m1!1e1!2e2!3e2!4i500!16b1`;
        const text = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
        try {
            const data = JSON.parse(text.split('\n').slice(1).join('\n'));
            const items = data?.[0]?.[8];
            if (Array.isArray(items) && items.length) {
                return items.map((it) => ({
                    name: String(it[2] || '').trim(),
                    address: String(it[1]?.[2] || '').trim(),
                    note: String(it[3] || '').trim(),
                    lat: it[1]?.[5]?.[2],
                    lng: it[1]?.[5]?.[3],
                })).filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
            }
        } catch { /* nächster Versuch */ }
        await sleep(1500);
    }
    throw new Error(`Liste ${id} konnte nicht geladen werden (ist sie noch öffentlich geteilt?)`);
}

const decode = (s) => s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function cleanDescription(html) {
    return decode(html || '')
        .replace(/<img[^>]*>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .split('\n').map((l) => l.trim()).filter(Boolean).join(' ')
        .trim();
}

async function loadMyMaps(id) {
    const res = await fetch(`https://www.google.com/maps/d/kml?mid=${id}&forcekml=1`, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`My Maps ${id}: HTTP ${res.status}`);
    const kml = await res.text();
    const out = [];
    for (const folder of kml.split('<Folder>').slice(1)) {
        const folderName = decode(folder.match(/<name>([\s\S]*?)<\/name>/)?.[1] || '').trim();
        const type = folderType(folderName);
        if (type === 'route') continue; // Wegbeschreibungen (Routen) nicht übernehmen
        for (const pm of folder.split('<Placemark>').slice(1)) {
            const pt = pm.match(/<Point>\s*<coordinates>\s*([-\d.]+),([-\d.]+)/);
            if (!pt) continue; // Linien/Flächen überspringen
            const name = decode(pm.match(/<name>([\s\S]*?)<\/name>/)?.[1] || '').trim();
            const note = cleanDescription(pm.match(/<description>([\s\S]*?)<\/description>/)?.[1]);
            let t = type;
            if (t === 'spot' && /skate ?park|skaterpark|skateanlage|bowl/i.test(name)) t = 'park';
            out.push({ name, address: '', note, lng: Number(pt[1]), lat: Number(pt[2]), type: t, folder: folderName });
        }
    }
    return out;
}

// ---------- Hilfen ----------

function distanceM(a, b) {
    const R = 6371000, toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

const norm = (s) => String(s || '').toLowerCase()
    .replace(/skate ?shop|skateshop|skatepark|skaterpark|skate park|und streetwear|e\.v\.|[-–|]/g, ' ')
    .replace(/[^a-z0-9äöüß ]/g, ' ').replace(/\s+/g, ' ').trim();

// Kein echter Spot-Name: gesetzte Markierung, nur "Skatepark" oder eine Firma/Praxis in der Nähe
const looksGeneric = (s) => /^(gesetzte markierung|dropped pin|skate ?park|spot|unbenannt|untitled)$/i.test(String(s).trim())
    || /\b(gmbh|kg|ag|eg|e\.k\.|ug)\b|geldautomat|krankengymnastik|physiotherap|praxis|reparaturstation|baufinanzierung/i.test(s);
const looksLikeCoords = (s) => /^\s*\d+°\d+'|^\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*$/.test(s);
const looksLikeAddress = (s) => /\d{5}|stra(ss|ß)e\s*\d|str\.\s*\d|weg\s*\d|platz\s*\d/i.test(s) || /^\S+(straße|str\.|weg|allee|platz|ring|gasse)\s*\d/i.test(s);

// Priorität, wenn derselbe Ort in mehreren Kategorien vorkommt
const RANK = { shop: 3, park: 2, spot: 1 };

function isSamePlace(a, b) {
    // Shops nie mit Spots/Parks zusammenlegen (z. B. Shop neben einer Plaza)
    if ((a.type === 'shop') !== (b.type === 'shop')) return false;
    const d = distanceM(a, b);
    if (d < 15) return true; // praktisch derselbe Punkt
    const weak = (s) => !s || looksLikeCoords(s) || looksLikeAddress(s) || looksGeneric(s);
    if (d < 60 && (weak(a.name) || weak(b.name))) return true; // gleicher Ort, einmal ohne richtigen Namen
    const na = norm(a.name), nb = norm(b.name);
    if (d < 400 && na && nb && na.length > 3 && (na === nb || na.includes(nb) || nb.includes(na))) return true;
    if (d < 3000 && na.length > 8 && na === nb) return true; // gleicher langer Name, leicht versetzt eingetragen
    return false;
}

// Ortsname für Punkte ohne richtigen Namen (OpenStreetMap, max. 1 Anfrage/s)
async function reverseCity(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&lat=${lat}&lon=${lng}&accept-language=de`, {
            headers: { 'User-Agent': 'CurbsideMagazine/1.0 (curbside.sortelba.com)' },
        });
        const j = await res.json();
        const a = j.address || {};
        return a.suburb || a.city_district || a.village || a.town || a.city || '';
    } catch { return ''; }
}

function makeId(p) {
    return `${p.type}_${p.lat.toFixed(5)}_${p.lng.toFixed(5)}`.replace(/[.-]/g, (c) => (c === '.' ? 'd' : 'm'));
}

// ---------- Ablauf ----------

const previous = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : { spots: [] };
const prevById = new Map((previous.spots || []).map((p) => [p.id, p]));

const raw = [];
for (const src of SOURCES) {
    const items = src.kind === 'list' ? (await loadList(src.ref)).map((p) => ({ ...p, type: src.type })) : await loadMyMaps(src.ref);
    console.log(`${src.label}: ${items.length} Punkte`);
    raw.push(...items.map((p) => ({ ...p, source: src.label })));
}

// Von dir geschickte Spots (map-extra.json) zuletzt: ist derselbe Ort schon in einer
// Google-Karte, wird er dort zusammengefasst (der Name aus der Google-Karte bleibt).
const extra = EXTRA.spots || [];
console.log(`Von dir geschickt (map-extra.json): ${extra.length} Punkte`);
raw.push(...extra
    .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
    .map((p) => ({ name: p.name || '', address: p.address || '', note: p.description || '', lat: p.lat, lng: p.lng, type: p.type || 'spot', source: MANUAL_LABEL })));

// Zusammenführen
const merged = [];
let dupes = 0;
for (const p of raw) {
    const twin = merged.find((m) => isSamePlace(m, p));
    if (!twin) { merged.push({ ...p }); continue; }
    dupes++;
    // Besseren Namen/Text/Kategorie behalten
    const weak = (s) => !s || looksLikeCoords(s) || looksLikeAddress(s) || looksGeneric(s);
    if (weak(twin.name) && !weak(p.name)) twin.name = p.name;
    if (!twin.note && p.note) twin.note = p.note;
    if (!twin.address && p.address) twin.address = p.address;
    if (RANK[p.type] > RANK[twin.type]) twin.type = p.type;
}

// Shops, die schon in "Support Skate Shops" stehen, nicht doppelt eintragen
const community = JSON.parse(fs.readFileSync(COMMUNITY_FILE, 'utf8'));
const knownShops = (community.sections.find((s) => s.id === 'sec_shops')?.items || [])
    .filter((i) => typeof i.lat === 'number' && typeof i.lng === 'number');
let knownShopDupes = 0;
const result = merged.filter((p) => {
    if (p.type !== 'shop') return true;
    const hit = knownShops.find((s) => distanceM(s, p) < 150 || (norm(s.name) && norm(s.name) === norm(p.name) && distanceM(s, p) < 2000));
    if (hit) { knownShopDupes++; return false; }
    return true;
});

// Namen für Punkte ohne echten Namen
const spots = [];
let lookups = 0;
for (const p of result) {
    const id = makeId(p);
    const prev = prevById.get(id);
    let name = p.name;
    if (!name || looksLikeCoords(name) || looksLikeAddress(name) || looksGeneric(name)) {
        if (prev?.name && !looksLikeCoords(prev.name) && !looksLikeAddress(prev.name) && !looksGeneric(prev.name)) name = prev.name;
        else {
            const city = await reverseCity(p.lat, p.lng);
            lookups++;
            await sleep(1100);
            const base = p.type === 'park' ? 'Skatepark' : p.type === 'shop' ? 'Skateshop' : 'Street-Spot';
            name = city ? `${base} ${city}` : base;
        }
        if (!p.address && p.name && looksLikeAddress(p.name)) p.address = p.name;
    }
    const spot = {
        id,
        name,
        type: p.type,
        lat: Number(p.lat.toFixed(6)),
        lng: Number(p.lng.toFixed(6)),
        ...(p.address ? { address: p.address } : {}),
        ...(p.note ? { description: p.note.slice(0, 300) } : {}),
        url: `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`,
        source: p.source,
        ...(prev?.hidden ? { hidden: true } : {}),
    };
    spots.push(spot);
}

spots.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'de'));
// Gleiche automatische Namen durchnummerieren ("Street-Spot Oststadt 2" …)
const seen = new Map();
for (const sp of spots) {
    if (!/^(Street-Spot|Skatepark|Skateshop) /.test(sp.name)) continue;
    const n = (seen.get(sp.name) || 0) + 1;
    seen.set(sp.name, n);
    if (n > 1) sp.name = `${sp.name} ${n}`;
}
fs.writeFileSync(MAP_FILE, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), spots }, null, 2) + '\n');

const count = (t) => spots.filter((s) => s.type === t).length;
console.log(`\nFertig: ${spots.length} Punkte (${count('park')} Skateparks, ${count('spot')} Spots, ${count('shop')} Shops).`);
console.log(`${dupes} Doppelte zusammengefasst, ${knownShopDupes} Shops waren schon bei „Support Skate Shops“, ${lookups} Ortsnamen ergänzt.`);
