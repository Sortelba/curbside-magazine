const KEY = 'skatelife-secret';
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
            return;
        }

        console.log(`[+] ${data.articles.length} neue Beiträge im Scan gefunden.`);
        
        // Nehme die ersten 3
        const toPublish = data.articles.slice(0, 3);
        console.log(`[*] Veröffentliche die ersten ${toPublish.length} Beiträge automatisch...`);

        for (const post of toPublish) {
            console.log(`    -> Publishing: ${post.title}`);
            const saveRes = await fetch(`${BASE_URL}/api/posts/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post, key: KEY })
            });
            
            if (!saveRes.ok) {
                console.error(`       [!] Fehler beim Speichern von: ${post.title}`);
            }
        }

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
