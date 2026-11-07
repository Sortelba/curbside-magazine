import fs from 'node:fs';
import path from 'node:path';

// Admin-Passwort aus .env.local (ADMIN_KEY=...)
function readEnvKey(name) {
    try {
        const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
        const m = env.match(new RegExp(`^${name}=(.*)$`, 'm'));
        return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
    } catch { return ''; }
}
const KEY = process.env.ADMIN_KEY || readEnvKey('ADMIN_KEY');
if (!KEY) {
    console.error('[FEHLER] Kein ADMIN_KEY in .env.local gefunden.');
    process.exit(1);
}
const BASE_URL = 'http://localhost:3000';

async function waitForServer() {
    let attempts = 0;
    while (attempts < 15) {
        try {
            const res = await fetch(`${BASE_URL}/api/settings?key=${KEY}`);
            if (res.ok) return true;
        } catch (e) {
            // Server not ready
        }
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 2000));
        attempts++;
    }
    return false;
}

async function rewriteOld() {
    // Rest des Gemini-Tageslimits nutzen: ein paar alte Rohtext-Posts umschreiben
    try {
        const rw = await fetch(`${BASE_URL}/api/posts/rewrite-old`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: KEY, limit: 10 })
        });
        const info = await rw.json().catch(() => ({}));
        if (rw.ok && info.rewritten > 0) {
            console.log(`[*] ${info.rewritten} ältere Beiträge umgeschrieben (noch ${info.remaining} übrig).`);
        } else if (rw.ok && info.remaining != null) {
            console.log(`[*] Ältere Beiträge: heute nichts mehr umgeschrieben (Gemini-Limit), noch ${info.remaining} übrig.`);
        }
    } catch (e) {
        console.log('[*] Ältere Beiträge umschreiben übersprungen:', e.message);
    }
}

async function run() {
    console.log("Prüfe Server-Status...");
    if (!await waitForServer()) {
        console.error("\n[FEHLER] Server konnte nicht erreicht werden. Läuft 'npm run dev'?");
        process.exit(1);
    }
    console.log("\n[OK] Server ist bereit.");

    console.log("Starte News-Scan...");
    try {
        const res = await fetch(`${BASE_URL}/api/cron/scrape?mode=draft&key=${KEY}`);
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`API Fehler: ${res.status} - ${err}`);
        }
        
        const data = await res.json();

        if (!data.articles || data.articles.length === 0) {
            console.log("[-] Keine neuen Beiträge gefunden.");
            await rewriteOld();
            return;
        }

        console.log(`[+] ${data.articles.length} neue Beiträge im Scan gefunden.`);
        
        // Bis zu 3 Beiträge veröffentlichen. Der Server lehnt Duplikate ab (409),
        // dann wird einfach der nächste Kandidat genommen.
        const MAX_POSTS = 3;
        let published = 0;
        let skipped = 0;

        for (const post of data.articles) {
            if (published >= MAX_POSTS) break;

            const saveRes = await fetch(`${BASE_URL}/api/posts/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post, key: KEY })
            });

            if (saveRes.status === 409) {
                const info = await saveRes.json().catch(() => ({}));
                console.log(`    [=] Übersprungen (schon vorhanden): ${post.title}${info.duplicateOf ? `  ->  ${info.duplicateOf}` : ''}`);
                skipped++;
            } else if (!saveRes.ok) {
                console.error(`    [!] Fehler beim Speichern von: ${post.title}`);
            } else {
                console.log(`    -> Veröffentlicht: ${post.title}`);
                published++;
            }
        }

        console.log(`\n[*] ${published} veröffentlicht, ${skipped} Duplikate übersprungen.`);

        await rewriteOld();

        console.log("\n------------------------------------------------");
        console.log("NEWS-AUTO-PUMP ERFOLGREICH");
        console.log("------------------------------------------------");
    } catch (error) {
        console.error("\n[FEHLER] Scan oder Publishing fehlgeschlagen:");
        console.error(error.message);
        process.exit(1);
    }
}

run();
