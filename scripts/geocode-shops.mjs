// Sucht für Skateshops in community.json die Koordinaten (für die Skatemap).
// Nutzt OpenStreetMap/Nominatim (max. 1 Anfrage pro Sekunde). Nur Shops ohne lat/lng.
// Aufruf: node scripts/geocode-shops.mjs
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'src', 'data', 'community.json');
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);
const shops = data.sections.find(s => s.id === 'sec_shops')?.items || [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function lookup(q) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'CurbsideMagazine/1.0 (curbside.sortelba.com)' } });
    if (!res.ok) return null;
    const [hit] = await res.json();
    return hit ? { lat: Number(Number(hit.lat).toFixed(5)), lng: Number(Number(hit.lon).toFixed(5)) } : null;
}

let found = 0, missing = [];
for (const shop of shops) {
    if (typeof shop.lat === 'number' && typeof shop.lng === 'number') continue;
    const addr = String(shop.address || '').trim();
    if (!addr || /online/i.test(addr)) { missing.push(`${shop.name} (keine Adresse)`); continue; }
    // Erst volle Adresse, sonst nur PLZ + Ort
    let pos = await lookup(addr);
    await sleep(1100);
    if (!pos) {
        const city = addr.match(/\d{5}\s+[^,]+/)?.[0];
        if (city) { pos = await lookup(city); await sleep(1100); }
    }
    if (pos) { Object.assign(shop, pos); found++; console.log(`✓ ${shop.name}`); }
    else missing.push(shop.name);
}

let out = JSON.stringify(data, null, 2);
if (raw.endsWith('\n')) out += '\n';
fs.writeFileSync(file, out);
console.log(`\n${found} Shops gefunden.${missing.length ? ' Ohne Position: ' + missing.join(', ') : ''}`);
