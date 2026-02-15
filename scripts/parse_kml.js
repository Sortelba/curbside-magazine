const fs = require('fs');
const cheerio = require('cheerio');

try {
    const kmlContent = fs.readFileSync('doc.kml', 'utf8');
    const $ = cheerio.load(kmlContent, { xmlMode: true });

    const spots = [];

    $('Folder').each((i, folder) => {
        const category = $(folder).find('name').first().text();
        $(folder).find('Placemark').each((j, placemark) => {
            const name = $(placemark).find('name').text();
            let description = $(placemark).find('description').text();

            // Clean up description if it contains HTML (sometimes Google Maps does this)
            if (description.includes('<![CDATA[')) {
                description = description.replace('<![CDATA[', '').replace(']]>', '');
            }

            const coordsStr = $(placemark).find('coordinates').text().trim();
            if (coordsStr) {
                const parts = coordsStr.split(/\s+/);
                // Sometimes there are multiple coordinates for a line, we just take the first one for a pin
                const firstCoord = parts[0];
                const [lng, lat] = firstCoord.split(',').map(Number);

                if (!isNaN(lat) && !isNaN(lng)) {
                    spots.push({
                        id: `spot_${i}_${j}`,
                        name,
                        description: description.trim(),
                        category,
                        pos: [lat, lng]
                    });
                }
            }
        });
    });

    fs.writeFileSync('src/data/spots.json', JSON.stringify(spots, null, 2));
    console.log(`Successfully extracted ${spots.length} spots to src/data/spots.json`);
} catch (error) {
    console.error('Error parsing KML:', error);
    process.exit(1);
}
