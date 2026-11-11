// Analytics im Admin-Dashboard: holt die Besucherzahlen von GoatCounter.
// Der Seiten-Code steht in settings.json (öffentlich, wird für den Zähler gebraucht),
// der API-Schlüssel nur lokal in .env.local (GOATCOUNTER_TOKEN) – nie bei GitHub.
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ADMIN_KEY } from "@/lib/adminAuth";

const ROOT = process.cwd();
const SETTINGS_FILE = path.join(ROOT, 'src', 'data', 'settings.json');
const ENV_FILE = path.join(ROOT, '.env.local');

const authorized = (r: Request) => Boolean(ADMIN_KEY) && r.headers.get('Authorization') === `Bearer ${ADMIN_KEY}`;
const readSettings = () => { try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch { return {}; } };

function readToken(): string {
    if (process.env.GOATCOUNTER_TOKEN) return process.env.GOATCOUNTER_TOKEN.trim();
    try {
        const m = fs.readFileSync(ENV_FILE, 'utf8').match(/^GOATCOUNTER_TOKEN=(.*)$/m);
        return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
    } catch { return ''; }
}

function writeToken(token: string) {
    let env = '';
    try { env = fs.readFileSync(ENV_FILE, 'utf8'); } catch { /* neue Datei */ }
    const line = `GOATCOUNTER_TOKEN=${token}`;
    if (/^GOATCOUNTER_TOKEN=.*$/m.test(env)) env = env.replace(/^GOATCOUNTER_TOKEN=.*$/m, line);
    else env = env.replace(/\n*$/, '\n') + `\n# Schlüssel für die Besucherzahlen (goatcounter.com → Settings → API)\n${line}\n`;
    fs.writeFileSync(ENV_FILE, env);
    process.env.GOATCOUNTER_TOKEN = token;
}

// Kurzer Zwischenspeicher, damit GoatCounter nicht bei jedem Klick gefragt wird
const cache = new Map<string, { at: number; data: any }>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gc(code: string, token: string, endpoint: string, params: Record<string, string | number>) {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const res = await fetch(`https://${code}.goatcounter.com/api/v0/${endpoint}?${qs}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 429) { await sleep(1500); return gc(code, token, endpoint, params); }
    if (!res.ok) {
        const msg = String((await res.json().catch(() => ({}))).error || '');
        if (/no site/i.test(msg)) throw new Error(`Die GoatCounter-Seite „${code}“ gibt es nicht. Prüf den Code.`);
        if (res.status === 401 || res.status === 403) throw new Error('GoatCounter lehnt den API-Schlüssel ab. Prüf, ob er stimmt und das Recht „Read statistics“ hat.');
        throw new Error(`GoatCounter antwortet mit Fehler ${res.status}${msg ? `: ${msg}` : ''}.`);
    }
    return res.json();
}

// Auf volle Stunde runden (verlangt GoatCounter)
const hour = (d: Date) => { const x = new Date(d); x.setUTCMinutes(0, 0, 0); return x.toISOString().replace('.000Z', 'Z'); };

export async function GET(request: Request) {
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const settings = readSettings();
    const code = String(settings.analytics?.goatcounter || '').trim();
    const token = readToken();
    const configured = { code, hasToken: Boolean(token) };
    if (!code || !token) return NextResponse.json({ configured });

    const params = new URL(request.url).searchParams;
    const days = Math.min(365, Math.max(1, Number(params.get('days')) || 30));
    const fresh = params.get('fresh') === '1'; // beim Öffnen des Dashboards immer neu holen
    const key = `${code}:${days}`;
    const hit = cache.get(key);
    if (!fresh && hit && Date.now() - hit.at < 5 * 60 * 1000) return NextResponse.json({ configured, ...hit.data, cached: true });

    try {
        const now = new Date();
        now.setUTCHours(now.getUTCHours() + 1); // laufende Stunde mitnehmen
        const start = new Date(now.getTime() - days * 86400000);
        const prevStart = new Date(start.getTime() - days * 86400000);
        const range = { start: hour(start), end: hour(now) };

        // Nacheinander abfragen – GoatCounter erlaubt nur wenige Anfragen pro Sekunde
        const total = await gc(code, token, 'stats/total', range); await sleep(300);
        const previous = await gc(code, token, 'stats/total', { start: hour(prevStart), end: hour(start) }); await sleep(300);
        const hits = await gc(code, token, 'stats/hits', { ...range, limit: 100 }); await sleep(300);
        const lists: Record<string, any[]> = {};
        for (const page of ['toprefs', 'locations', 'systems', 'browsers', 'sizes']) {
            lists[page] = (await gc(code, token, `stats/${page}`, { ...range, limit: 10 })).stats || [];
            await sleep(300);
        }

        const all = (hits.hits || []) as any[];
        const pages = all.filter((h) => !h.event).map((h) => ({ path: h.path, title: h.title, count: h.count }));
        const events = all.filter((h) => h.event).map((h) => ({ path: h.path, title: h.title, count: h.count }));
        const daily = (total.stats || []).map((s: any) => ({ day: s.day, count: s.daily ?? 0 }));
        const data = {
            days,
            total: total.total ?? 0,
            previousTotal: previous.total ?? 0,
            totalEvents: total.total_events ?? 0,
            daily,
            pages,
            events,
            refs: lists.toprefs,
            locations: lists.locations,
            systems: lists.systems,
            browsers: lists.browsers,
            sizes: lists.sizes,
            dashboardUrl: `https://${code}.goatcounter.com`,
            fetchedAt: new Date().toISOString(),
        };
        cache.set(key, { at: Date.now(), data });
        return NextResponse.json({ configured, ...data });
    } catch (e) {
        return NextResponse.json({ configured, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
    }
}

export async function POST(request: Request) {
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    if (body.action !== 'saveConfig') return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });

    // "https://curbside.goatcounter.com/..." oder nur "curbside"
    const raw = String(body.code || '').trim().toLowerCase();
    const code = raw.match(/^(?:https?:\/\/)?([a-z0-9-]+)\.goatcounter\.com/)?.[1] || raw;
    if (code && !/^[a-z0-9-]{2,50}$/.test(code)) return NextResponse.json({ error: 'Der Code darf nur Buchstaben, Zahlen und Bindestriche haben (z. B. „curbside“).' }, { status: 400 });

    const settings = readSettings();
    settings.analytics = { ...(settings.analytics || {}), goatcounter: code };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n');
    const token = String(body.token || '').trim();
    if (token) writeToken(token);
    cache.clear();
    return NextResponse.json({ ok: true, configured: { code, hasToken: Boolean(readToken()) } });
}
