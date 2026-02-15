import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

async function processImages() {
    if (!fs.existsSync(uploadsDir)) {
        console.log("No uploads directory found.");
        return;
    }

    const files = fs.readdirSync(uploadsDir);
    let count = 0;

    for (const file of files) {
        if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

        const filepath = path.join(uploadsDir, file);
        const metadata = await sharp(filepath).metadata();

        if (metadata.width > 800) {
            console.log(`Resizing ${file} (${metadata.width}px)...`);

            const tempPath = filepath + '.tmp';

            await sharp(filepath)
                .resize(800)
                .jpeg({ quality: 80 }) // Convert to JPEG for consistency & compression
                .toFile(tempPath);

            // simple move
            fs.unlinkSync(filepath);
            fs.renameSync(tempPath, filepath); // keep original extension? No, might become jpg but file extension remains png. Browser handles it usually, but let's be clean.
            // Actually, keep original extension but force format based on it OR convert to webp/jpg.
            // Let's just resize and save back to same path, sharp handles format if not specified, 
            // but if I want compression I should specify. 
            // If I just .resize(800).toBuffer(), then write buffer.

            // Better approach to keep it simple and robust:
            // Resize and save over original.
            const buffer = await sharp(filepath)
                .resize(800, null, { withoutEnlargement: true })
                .toBuffer();

            fs.writeFileSync(filepath, buffer);

            console.log(`Optimized ${file}`);
            count++;
        }
    }

    console.log(`Done! Optimized ${count} images.`);
}

processImages();
