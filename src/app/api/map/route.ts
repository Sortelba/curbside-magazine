// Skatemap im Admin-Dashboard (Reiter Skatemap):
// Karten-Quellen verwalten, eigene Spots eintragen und den Import ("Scan") starten.
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { ADMIN_KEY } from "@/lib/adminAuth";

const ROOT = process.cwd();
const EXTRA_FILE = path.join(ROOT, 'src', 'data', 'map-extra.json');
const MAP_FILE = path.join(ROOT, 'src', 'data', 'map.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const TYPES = ['spot', 'park', 'shop'];

const readJson = (file: string, fallback: any) => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};
const writeExtra = (data: any) => fs.writeFileSync(EXTRA_FILE, JSON.stringify(data, null, 2) + '\n');

function authorized(request: Request) {
    return Boolean(ADMIN_KEY) && request.headers.get('Authorization') === `Bearer ${ADMIN_KEY}`;
}

function stats() {
    const map = readJson(MAP_FILE, { spots: [] });
    const spots = map.spots || [];
    const count = (t: string) => spots.filter((s: any) => s.type === t).length;
    return { updated: map.updated || null, total: spots.length, park: count('park'), spot: count('spot'), shop: count('shop') };
}

/** Kurzlinks (maps.app.goo.gl) auflösen → lange Google-Maps-Adresse */
async function resolveUrl(url: string): Promise<string> {
    let current = url.trim();
    for (let i = 0; i < 4; i++) {
        if (!/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//.test(current)) break;
        // Mit Browser-Kennung liefert Google eine JS-Seite statt einer Weiterleitung
        const res = await fetch(current, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        const next = res.headers.get('location');
        if (!next) break;
        current = next;
    }
    return current;
}

/** Koordinaten aus einem Google-Maps-Link oder Text wie "49.01, 8.40" lesen */
function parseCoords(text: string): { lat: number; lng: number } | null {
    const t = decodeURIComponent(text);
    const patterns = [
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,              // genauer Pin eines Ortes
        /[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,                   // Kartenmitte
        /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/, // reine Koordinaten
    ];
    for (const p of patterns) {
        const m = t.match(p);
        if (m) {
            const lat = Number(m[1]), lng = Number(m[2]);
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
        }
    }
    return null;
}

/** Ortsname aus dem Link (/place/Name/...) als Namensvorschlag */
function placeName(url: string): string {
    const m = decodeURIComponent(url).match(/\/place\/([^/@]+)/);
    return m ? m[1].replace(/\+/g, ' ').trim() : '';
}

async function geocode(address: string) {
    // OpenStreetMap antwortet manchmal langsam → bis zu 2 Versuche à 20 s
    for (let i = 0; i < 2; i++) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`, {
                headers: { 'User-Agent': 'CurbsideMagazine/1.0 (curbside.sortelba.com)' }, signal: AbortSignal.timeout(20000),
            });
            const [hit] = await res.json();
            return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
        } catch {
            await new Promise((r) => setTimeout(r, 1500));
        }
    }
    throw new Error('Adresse konnte gerade nicht gesucht werden (OpenStreetMap antwortet nicht). Versuch es gleich nochmal oder nimm einen Google-Maps-Link.');
}

/** Google-Maps-Link → Quelle (My-Maps-Karte oder gespeicherte Liste) */
async function parseSource(url: string, type: string) {
    const full = await resolveUrl(url);
    const mid = full.match(/[?&]mid=([\w-]+)/)?.[1];
    if (mid) {
        const kml = await (await fetch(`https://www.google.com/maps/d/kml?mid=${mid}&forcekml=1`, { headers: { 'User-Agent': UA } })).text();
        const name = kml.match(/<Document>\s*<name>([\s\S]*?)<\/name>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        if (!kml.includes('<kml')) throw new Error('Die My-Maps-Karte ist nicht öffentlich. In My Maps: Teilen → „Jeder mit dem Link kann ansehen“.');
        return { kind: 'mymaps', ref: mid, label: `My Maps „${name || mid}“`, url };
    }
    const list = full.match(/!2s([\w-]{10,})!3e3/)?.[1] || full.match(/placelists\/list\/([\w-]+)/)?.[1];
    if (list) {
        if (!TYPES.includes(type)) throw new Error('Bitte wähle, was in der Liste steht (Spots, Skateparks oder Shops).');
        const label = { spot: 'Spots', park: 'Skateparks', shop: 'Shops' }[type];
        return { kind: 'list', ref: list, type, label: `Google-Liste (${label})`, url };
    }
    throw new Error('Das ist kein Link zu einer My-Maps-Karte oder gespeicherten Google-Maps-Liste.');
}

/** Startet scripts/import-maps.mjs und gibt die Zusammenfassung zurück */
function runImport(): Promise<{ ok: boolean; summary: string; changes?: any }> {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, ['scripts/import-maps.mjs'], { cwd: ROOT });
        let out = '', err = '';
        const timer = setTimeout(() => child.kill(), 5 * 60 * 1000);
        child.stdout.on('data', (d) => (out += d));
        child.stderr.on('data', (d) => (err += d));
        child.on('close', (code) => {
            clearTimeout(timer);
            const lines = (code === 0 ? out : err || out).trim().split('\n').filter(Boolean);
            if (code !== 0) return resolve({ ok: false, summary: lines.pop() || 'Import fehlgeschlagen' });
            // "Fertig: …" + Zeile danach als Zusammenfassung, Änderungen als JSON
            const i = lines.findIndex((l) => l.startsWith('Fertig:'));
            const summary = i >= 0 ? lines.slice(i, i + 2).join(' ') : lines.slice(-2).join(' ');
            let changes = null;
            const json = lines.find((l) => l.startsWith('CHANGES_JSON '));
            try { if (json) changes = JSON.parse(json.slice('CHANGES_JSON '.length)); } catch { /* ohne Änderungsliste */ }
            resolve({ ok: true, summary, changes });
        });
    });
}

export async function GET(request: Request) {
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const extra = readJson(EXTRA_FILE, { sources: [], spots: [] });
    return NextResponse.json({ sources: extra.sources || [], spots: extra.spots || [], stats: stats() });
}

export async function POST(request: Request) {
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const extra = readJson(EXTRA_FILE, { sources: [], spots: [] });
    extra.sources = extra.sources || [];
    extra.spots = extra.spots || [];

    try {
        switch (body.action) {
            case 'scan': {
                const result = await runImport();
                return NextResponse.json({ ...result, stats: stats() }, { status: result.ok ? 200 : 500 });
            }

            case 'addSource': {
                const src = await parseSource(String(body.url || ''), String(body.type || ''));
                if (extra.sources.some((s: any) => s.ref === src.ref)) throw new Error('Diese Karte ist schon eingetragen.');
                extra.sources.push({ id: `src_${Date.now()}`, ...src });
                writeExtra(extra);
                const result = await runImport();
                return NextResponse.json({ ...result, sources: extra.sources, stats: stats() });
            }

            case 'deleteSource': {
                extra.sources = extra.sources.filter((s: any) => s.id !== body.id);
                writeExtra(extra);
                const result = await runImport();
                return NextResponse.json({ ...result, sources: extra.sources, stats: stats() });
            }

            case 'addSpot': {
                const input = body.spot || {};
                const type = TYPES.includes(input.type) ? input.type : 'spot';
                const link = String(input.link || '').trim();
                let pos = null, nameFromLink = '';
                if (link) {
                    const full = await resolveUrl(link);
                    pos = parseCoords(full);
                    nameFromLink = placeName(full);
                }
                if (!pos && input.address) pos = await geocode(String(input.address));
                if (!pos) throw new Error('Keine Position gefunden. Füge einen Google-Maps-Link, Koordinaten (z. B. 49.01, 8.40) oder eine Adresse ein.');
                const name = String(input.name || '').trim() || nameFromLink;
                if (!name) throw new Error('Bitte gib dem Spot einen Namen.');
                const spot: any = {
                    id: `manual_${Date.now()}`,
                    name, type,
                    lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)),
                    ...(input.address ? { address: String(input.address).trim() } : {}),
                    ...(input.description ? { description: String(input.description).trim() } : {}),
                    added: new Date().toISOString().slice(0, 10),
                };
                extra.spots.push(spot);
                writeExtra(extra);
                const result = await runImport();
                return NextResponse.json({ ...result, spot, spots: extra.spots, stats: stats() });
            }

            case 'deleteSpot': {
                extra.spots = extra.spots.filter((s: any) => s.id !== body.id);
                writeExtra(extra);
                const result = await runImport();
                return NextResponse.json({ ...result, spots: extra.spots, stats: stats() });
            }

            default:
                return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
        }
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
    }
}
