// Exportiert die komplette Skatemap (Spots, Skateparks, Shops) als KML-Datei,
// die du in Google My Maps importieren kannst (Karte erstellen → Importieren).
//
// Aufruf:  node scripts/export-kml.mjs
// Ergebnis: exports/curbside-skatemap.kml  (wird nicht zu GitHub hochgeladen)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'map.json'), 'utf8'));
const community = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'community.json'), 'utf8'));

const shops = (community.sections.find((s) => s.id === 'sec_shops')?.items || [])
    .filter((i) => typeof i.lat === 'number' && typeof i.lng === 'number' && !i.hidden)
    .map((i) => ({
        name: i.name, type: 'shop', lat: i.lat, lng: i.lng, address: i.address,
        description: [i.hours && `Öffnungszeiten: ${i.hours}`].filter(Boolean).join(' '),
        url: i.url,
    }));
const points = [...(map.spots || []).filter((p) => !p.hidden), ...shops];

// Farben wie auf der Website. KML-Farben sind aabbggrr.
const LAYERS = [
    { type: 'park', name: 'Skateparks', style: 'park', kml: 'ffeb6325' },
    { type: 'spot', name: 'Spots', style: 'spot', kml: 'ff1673f9' },
    { type: 'shop', name: 'Skateshops', style: 'shop', kml: 'ff4aa316' },
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const styles = LAYERS.map((l) => `    <Style id="${l.style}">
      <IconStyle>
        <color>${l.kml}</color>
        <scale>1</scale>
        <Icon><href>https://www.gstatic.com/mapspro/images/stock/503-wht-blank_maps.png</href></Icon>
      </IconStyle>
    </Style>`).join('\n');

const folders = LAYERS.map((l) => {
    const items = points.filter((p) => p.type === l.type).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const placemarks = items.map((p) => {
        const desc = [p.address, p.description, p.url && !p.url.includes('google.com/maps') ? p.url : '']
            .filter(Boolean).join('\n');
        return `      <Placemark>
        <name>${esc(p.name)}</name>${desc ? `\n        <description>${esc(desc)}</description>` : ''}
        <styleUrl>#${l.style}</styleUrl>
        <Point><coordinates>${p.lng},${p.lat},0</coordinates></Point>
      </Placemark>`;
    }).join('\n');
    return `    <Folder>
      <name>${l.name}</name>
${placemarks}
    </Folder>`;
}).join('\n');

const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>CURBSIDE Skatemap</name>
    <description>Alle Spots, Skateparks und Skateshops von curbside.sortelba.com</description>
${styles}
${folders}
  </Document>
</kml>
`;

const outDir = path.join(ROOT, 'exports');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'curbside-skatemap.kml');
fs.writeFileSync(outFile, kml);
const count = (t) => points.filter((p) => p.type === t).length;
console.log(`${outFile}\n${points.length} Punkte: ${count('park')} Skateparks, ${count('spot')} Spots, ${count('shop')} Shops`);
