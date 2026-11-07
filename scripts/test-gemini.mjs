// Prüft, ob der Gemini-Schlüssel aus .env.local funktioniert: node scripts/test-gemini.mjs
import fs from 'node:fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const env = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const key = (env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1] || '').trim().replace(/^["']|["']$/g, '');
if (!key) {
  console.log('❌ Kein Schlüssel in .env.local (Zeile GEMINI_API_KEY=...).');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(key);
for (const name of ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite']) {
  try {
    const model = genAI.getGenerativeModel({ model: name });
    const res = await model.generateContent('Antworte nur mit: Kickflip OK');
    console.log(`✅ Schlüssel funktioniert (${name}): ${res.response.text().trim()}`);
    process.exit(0);
  } catch (e) {
    console.log(`⚠️  ${name}: ${String(e.message || e).slice(0, 200)}`);
  }
}
console.log('❌ Kein Modell erreichbar.');
process.exit(1);
