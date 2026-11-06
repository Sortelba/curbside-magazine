// Build für GitHub Pages: Die API-Routen (nur für das lokale Admin Dashboard)
// können nicht statisch exportiert werden und werden deshalb während des
// Builds kurz nach .tmp-api-backup verschoben und danach zurückgelegt.
//
// `node scripts/prepare-static-export.mjs --restore` legt einen übrig
// gebliebenen Backup-Ordner zurück (läuft automatisch vor `npm run dev`).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const backupDir = path.join(process.cwd(), '.tmp-api-backup');

function restore() {
  if (!fs.existsSync(backupDir)) return;
  if (fs.existsSync(apiDir)) {
    console.warn('Warnung: src/app/api und .tmp-api-backup existieren beide – nichts verändert.');
    return;
  }
  fs.renameSync(backupDir, apiDir);
  console.log('src/app/api wiederhergestellt.');
}

if (process.argv.includes('--restore')) {
  restore();
  process.exit(0);
}

// Immer zuerst einen Rest von einem abgebrochenen Build aufräumen.
restore();

const isStaticExportBuild = process.env.GITHUB_ACTIONS === 'true' || process.env.NEXT_STATIC_EXPORT === 'true';
if (!isStaticExportBuild) {
  console.log('Local dev environment detected; leaving API routes in place.');
  process.exit(0);
}

if (!fs.existsSync(apiDir)) {
  console.log('src/app/api not present; nothing to move.');
  process.exit(0);
}

fs.renameSync(apiDir, backupDir);
console.log('Moved src/app/api out of the way for static export build.');

// Auch bei Abbruch (Ctrl+C, Terminal schließen) zurücklegen.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    restore();
    process.exit(1);
  });
}

let status = 1;
try {
  const result = spawnSync('npx next build', { stdio: 'inherit', shell: true, env: process.env });
  status = result.status ?? 1;
} finally {
  restore();
}
process.exit(status);
