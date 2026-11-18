// Macht aus den zuletzt veröffentlichten News drei fertige Instagram-Beiträge
// (Bild 1080×1350 + Text mit Hashtags und @Erwähnungen) für 10, 16 und 19 Uhr.
//
// Läuft automatisch am Ende von Publish.command (also auch bei Autoscan und beim
// Veröffentlichen im Admin). Von Hand:  node scripts/make-insta-posts.mjs [--force]
//   --force   auch Beiträge nehmen, die schon einmal exportiert wurden
//
// Ausgabe: exports/instagram/beitraege/  (wird bei jedem Scan mit neuen News ersetzt)
//   1_10-00_<titel>.jpg + .txt,  2_16-00_…,  3_19-00_…,  plus Plan.txt
// Welche Beiträge beim letzten Lauf schon da waren, steht in exports/instagram/beitraege/.erledigt.json
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_BASE = path.join(ROOT, 'exports', 'instagram', 'beitraege');
const DONE_FILE = path.join(OUT_BASE, '.erledigt.json');
const SITE = 'curbside.sortelba.com';
const FORCE = process.argv.includes('--force');

// Der stärkste Beitrag (Platz 1 im Scan) kommt um 19 Uhr, wenn am meisten los ist.
const SLOTS = ['19:00', '16:00', '10:00'];

const W = 1080, H = 1350;
const INK = '#09090b', WHITE = '#fafafa';
const FONT_FILE = '/System/Library/Fonts/SFNSItalic.ttf'; // Website-Schrift (system-ui = SF Pro)
const FONT_FILE_UI = '/System/Library/Fonts/SFNS.ttf';

// Nur Accounts, die sicher stimmen. Lieber keine Markierung als eine falsche.
const HANDLES = [
  [/thrasher/i, '@thrashermag'],
  [/jenkem/i, '@jenkemmag'],
  [/nine club/i, '@thenineclub'],
  [/red bull/i, '@redbullskate'],
  [/adidas/i, '@adidasskateboarding'],
  [/nike sb|\bnikesb\b/i, '@nikesb'],
  [/\bvans\b/i, '@vansskate'],
  [/baker/i, '@bakerskateboards'],
  [/zero skateboards/i, '@zeroskateboards'],
  [/\bdc shoes\b/i, '@dcshoes'],
  [/new balance numeric/i, '@nbnumeric'],
  [/\bx games\b/i, '@xgames'],
  [/tony hawk/i, '@tonyhawk'],
  [/olympi/i, '@olympics'],
  [/world skate/i, '@worldskate'],
  [/street league|\bsls\b/i, '@streetleague'],
];

const BASE_TAGS = ['#skateboarding', '#skate', '#skatenews', '#skateboard', '#skatelife', '#curbside'];
const SKIP_TAGS = /^(news|instagram|youtube|update|video|community|skatemap|business)$/i;

// ---------- Helfer ----------
const readJson = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; } };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const msOf = (p) => Number(String(p.id).split('_')[1]) || 0;
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 44).replace(/-[^-]*$/, '');
const hashtag = (s) => '#' + s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function cleanTitle(t) {
  return String(t || '').replace(/^\s*\[[^\]]*\]\s*/, '').trim();
}

// Fließtext ohne Quellen-Zeilen, auf ganze Sätze gekürzt.
function bodyText(p, max = 420) {
  const raw = p.translations?.de?.content || p.description || '';
  let t = raw
    .replace(/\(Originalquelle:[^)]*\)/gi, '')
    .split('\n').map((l) => l.trim())
    .filter((l) => l && !/^(quelle|source|originalquelle)\s*:/i.test(l) && !/^https?:\/\//.test(l))
    .join('\n\n');
  const title = cleanTitle(p.translations?.de?.title || p.title);
  if (t.startsWith(title)) t = t.slice(title.length).trim();
  if (t.length <= max) return t.replace(/\.\.\.$/, '…');
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + ' …';
}

function mentionsFor(p) {
  const hay = [p.source, p.title, p.translations?.de?.content, p.originalUrl, ...(p.tags || [])].join(' ');
  const out = new Set();
  for (const [re, h] of HANDLES) if (re.test(hay)) out.add(h);
  // Echte @Handles aus Instagram-Beiträgen übernehmen
  for (const m of hay.matchAll(/(?:^|\s)@([a-z0-9._]{2,30})/gi)) out.add('@' + m[1].replace(/\.$/, ''));
  return [...out].slice(0, 6);
}

function hashtagsFor(p) {
  const tags = new Set(BASE_TAGS);
  if (p.type === 'video' || /\b(video|clip|part|edit)\b/i.test(p.title)) { tags.add('#skatevideo'); tags.add('#videopart'); }
  for (const t of p.tags || []) {
    if (SKIP_TAGS.test(t) || t.toLowerCase() === String(p.source || '').toLowerCase()) continue;
    if (/news$/i.test(t)) continue;
    const h = hashtag(t);
    if (h.length > 3 && h.length < 30) tags.add(h);
  }
  tags.add('#skateboardingisfun');
  tags.add('#supportyourlocalscene');
  return [...tags].slice(0, 18);
}

function imageCandidates(p) {
  const list = [];
  const yt = String(p.media?.videoUrl || p.content || '').match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/);
  if (p.type === 'image' && /^https?:/.test(p.content || '')) list.push(p.content);
  for (const u of p.media?.images || []) if (!/_S_JD\.|thumb|avatar|logo/i.test(u)) list.push(u);
  if (yt) list.push(`https://img.youtube.com/vi/${yt[1]}/maxresdefault.jpg`, `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`);
  return [...new Set(list)];
}

async function fetchImage(urls) {
  for (const raw of urls) {
    const u = raw.startsWith('/') ? path.join(ROOT, 'public', raw) : raw;
    try {
      let buf;
      if (!/^https?:/.test(u)) buf = fs.readFileSync(u);
      else {
        const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
        if (!r.ok) continue;
        buf = Buffer.from(await r.arrayBuffer());
      }
      const m = await sharp(buf).metadata();
      if ((m.width || 0) >= 400) return buf; // zu kleine Bilder sehen auf Instagram matschig aus
    } catch { /* nächster Kandidat */ }
  }
  return null;
}

// Text als PNG (Pango) in der Website-Schrift.
async function textPng(str, { size, width, italic = true, weight = 'heavy', color = WHITE, spacing = -0.04, align = 'left' }) {
  const ls = Math.round(spacing * size * 1024);
  const markup = `<span foreground="${color}" font_weight="${weight}"${italic ? ' font_style="italic"' : ''} letter_spacing="${ls}">${esc(str)}</span>`;
  const img = sharp({
    text: { text: markup, font: `SF Pro ${size}`, fontfile: italic ? FONT_FILE : FONT_FILE_UI, rgba: true, width, dpi: 72, align, spacing: -Math.round(size * 0.12) },
  });
  const buf = await img.png().toBuffer();
  const m = await sharp(buf).metadata();
  return { buf, w: m.width, h: m.height };
}

async function fitTitle(title, width, maxH) {
  for (let size = 104; size >= 52; size -= 4) {
    const t = await textPng(title.toUpperCase(), { size, width });
    if (t.h <= maxH) return t;
  }
  return textPng(title.toUpperCase(), { size: 48, width });
}

async function renderCard(p, outFile) {
  const title = cleanTitle(p.translations?.de?.title || p.title);
  const photo = await fetchImage(imageCandidates(p));
  const layers = [];

  const PHOTO_H = 860;
  let base = sharp({ create: { width: W, height: H, channels: 3, background: INK } });
  if (photo) {
    const ph = await sharp(photo).resize(W, PHOTO_H, { fit: 'cover', position: 'attention' }).toBuffer();
    layers.push({ input: ph, top: 0, left: 0 });
    // weicher Übergang vom Foto in den schwarzen Textblock
    const fade = Buffer.from(`<svg width="${W}" height="260"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity="1"/></linearGradient></defs>
      <rect width="${W}" height="260" fill="url(#g)"/></svg>`);
    layers.push({ input: fade, top: PHOTO_H - 260, left: 0 });
  }

  const M = 72;
  // Rubrik-Balken (schwarz auf weiß, schräg wie auf der Website)
  const kind = p.type === 'video' ? 'NEUES VIDEO' : 'SKATE-NEWS';
  const tag = await textPng(kind, { size: 34, width: 600, color: INK, spacing: 0.02 });
  const tagW = tag.w + 48, tagH = tag.h + 22;
  const tagTop = photo ? PHOTO_H - 120 : 300;
  layers.push({
    input: Buffer.from(`<svg width="${tagW + 20}" height="${tagH}"><polygon points="10,0 ${tagW + 20},0 ${tagW + 10},${tagH} 0,${tagH}" fill="${WHITE}"/></svg>`),
    top: tagTop, left: M - 10,
  });
  layers.push({ input: tag.buf, top: tagTop + 11, left: M + 24 });

  // Titel
  const titleTop = tagTop + tagH + 28;
  const footerTop = H - 120;
  const t = await fitTitle(title, W - 2 * M, footerTop - titleTop - 40);
  layers.push({ input: t.buf, top: titleTop, left: M });

  // Fußzeile: Wortmarke links, Quelle rechts
  const mark = await textPng('CURBSIDE', { size: 44, width: 500, spacing: -0.05 });
  layers.push({ input: mark.buf, top: footerTop + 20, left: M });
  const src = await textPng(`${SITE}${p.source && p.source !== 'CURBSIDE' ? `  ·  Quelle: ${p.source}` : ''}`,
    { size: 26, width: 700, italic: false, weight: 'medium', color: '#a1a1aa', spacing: 0, align: 'right' });
  layers.push({ input: src.buf, top: footerTop + 34, left: W - M - src.w });
  layers.push({ input: Buffer.from(`<svg width="${W - 2 * M}" height="2"><rect width="${W - 2 * M}" height="2" fill="#3f3f46"/></svg>`), top: footerTop, left: M });

  await base.composite(layers).jpeg({ quality: 92, mozjpeg: true }).toFile(outFile);
  return !!photo;
}

function caption(p) {
  const title = cleanTitle(p.translations?.de?.title || p.title);
  const body = bodyText(p);
  let ments = mentionsFor(p);
  const srcHandle = p.source && ments.find((h) => new RegExp(p.source.split(' ')[0], 'i').test(h));
  if (srcHandle) ments = ments.filter((h) => h !== srcHandle);
  const credit = p.source && p.source !== 'CURBSIDE' && p.source !== 'Instagram'
    ? `📸 / Quelle: ${srcHandle || p.source}` : '';
  return [
    `${p.type === 'video' ? '🎥' : '🛹'} ${title}`,
    '',
    body,
    '',
    `👉 Die ganze Story auf ${SITE} (Link in Bio)`,
    credit,
    ments.length ? `\n${ments.join(' ')}` : '',
    '',
    '.',
    hashtagsFor(p).join(' '),
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function openFolder(dir) {
  if (process.platform === 'darwin' && !process.env.NO_OPEN) execFile('open', [dir], () => {});
}

// ---------- Ablauf ----------
async function main() {
  const posts = readJson(path.join(ROOT, 'src', 'data', 'posts.json'), []);
  const state = readJson(DONE_FILE, null);
  const done = new Set(Array.isArray(state) ? state : state?.done || []);
  // Neu = war beim letzten Lauf noch nicht auf der Seite. Egal ob Autoscan, einzeln
  // freigegebener Scan-Beitrag oder selbst geschriebene News. Beim allerersten Lauf
  // (noch keine Liste) zählen die Beiträge der letzten 36 Stunden.
  // Alte Statusdatei ohne Liste: alles Vorhandene gilt als bekannt (nichts nachholen).
  const known = state?.known ? new Set(state.known) : state ? new Set(posts.map((p) => p.id)) : null;
  const firstCutoff = Date.now() - 36 * 3600 * 1000;
  const isNew = (p) => FORCE ? msOf(p) > firstCutoff : known ? !known.has(p.id) : msOf(p) > firstCutoff && !done.has(p.id);
  const saveState = (extraDone = []) => {
    fs.mkdirSync(OUT_BASE, { recursive: true });
    fs.writeFileSync(DONE_FILE, JSON.stringify({
      known: posts.map((p) => p.id),
      done: [...done, ...extraDone].slice(-500),
    }));
  };

  // posts.json hat die neuesten oben -> umdrehen = Reihenfolge der Veröffentlichung (Rang im Scan)
  const fresh = posts.filter((p) => p.status === 'published' && isNew(p)).reverse();

  if (!fresh.length) {
    saveState();
    console.log('[Instagram] Keine neuen Beiträge – nichts zu tun.');
    return;
  }
  // Die drei zuletzt veröffentlichten, Rang 1 zuerst
  const pick = fresh.slice(-3);

  // Immer derselbe Ordner: die Beiträge vom letzten Scan werden ersetzt,
  // damit sich nichts ansammelt. (Ohne neue News bleiben die alten liegen.)
  const dir = OUT_BASE;
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (/\.(jpg|txt)$/i.test(f)) fs.rmSync(full);
    else if (/^\d{4}-\d{2}-\d{2}(-\d+)?$/.test(f) && fs.statSync(full).isDirectory()) fs.rmSync(full, { recursive: true }); // alte Datums-Ordner
  }

  const plan = [];
  const slots = SLOTS.slice(0, pick.length).map((s, i) => ({ s, i })).sort((a, b) => a.s.localeCompare(b.s));
  // Slot-Zuordnung: Rang i -> SLOTS[i]; Dateinummer nach Uhrzeit
  for (let rank = 0; rank < pick.length; rank++) {
    const p = pick[rank];
    const time = SLOTS[rank];
    const nr = slots.findIndex((x) => x.i === rank) + 1;
    const name = `${nr}_${time.replace(':', '-')}_${slug(cleanTitle(p.translations?.de?.title || p.title)) || 'beitrag'}`;
    const hasPhoto = await renderCard(p, path.join(dir, `${name}.jpg`));
    const text = caption(p);
    fs.writeFileSync(path.join(dir, `${name}.txt`), text + '\n');
    plan.push({ nr, time, name, title: cleanTitle(p.title), url: `https://${SITE}/news/${p.id}/`, hasPhoto });
    done.add(p.id);
    console.log(`[Instagram] ${time} Uhr: ${cleanTitle(p.title)}${hasPhoto ? '' : '  (kein Foto gefunden, nur Text)'}`);
  }
  plan.sort((a, b) => a.nr - b.nr);

  fs.writeFileSync(path.join(dir, 'Plan.txt'), [
    `CURBSIDE – Instagram-Plan für ${today()}`,
    '',
    ...plan.map((x) => `${x.time} Uhr  ${x.title}\n          Bild: ${x.name}.jpg   Text: ${x.name}.txt\n          Seite: ${x.url}`),
    '',
    'Tipp: Text aus der .txt-Datei kopieren, @Erwähnungen kurz prüfen und die Accounts',
    'zusätzlich im Bild markieren. Link in Bio muss auf die Homepage zeigen.',
  ].join('\n') + '\n');

  saveState();
  console.log(`[Instagram] ${plan.length} Beiträge fertig: ${dir}`);
  openFolder(dir);
}

main().catch((e) => {
  // Darf das Veröffentlichen nie blockieren
  console.log('[Instagram] Beiträge konnten nicht erstellt werden:', e.message);
});
