import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const backupDir = path.join(process.cwd(), '.tmp-api-backup');
const isStaticExportBuild = process.env.GITHUB_ACTIONS === 'true' || process.env.NEXT_STATIC_EXPORT === 'true';

if (!isStaticExportBuild) {
  console.log('Local dev environment detected; leaving API routes in place.');
  process.exit(0);
}

if (!fs.existsSync(apiDir)) {
  console.log('src/app/api not present; nothing to move.');
  process.exit(0);
}

fs.rmSync(backupDir, { recursive: true, force: true });
fs.renameSync(apiDir, backupDir);
console.log('Moved src/app/api out of the way for static export build.');

try {
  const result = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
} finally {
  if (fs.existsSync(backupDir)) {
    fs.renameSync(backupDir, apiDir);
    console.log('Restored src/app/api after static export build.');
  }
}
