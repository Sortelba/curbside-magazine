import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import LearnContent from '@/components/LearnContent';

// Static generation is used for GitHub Pages

async function getLearnData() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'learn.json');
    if (!fs.existsSync(filePath)) {
        return { basics: [], coaches: [], randomizer: { beginner: [], intermediate: [], pro: [] }, channels: [] };
    }
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
}

export const metadata: Metadata = {
    title: 'Skaten lernen – Grundlagen, Tricks & Coaches',
    description: 'Skateboard fahren lernen: Grundlagen für Anfänger, Trick-Randomizer, Skateboard-Coaches in deiner Nähe und die besten Lern-Kanäle.',
    alternates: { canonical: '/learn/' },
};

export default async function LearnPage() {
    const data = await getLearnData();
    return <LearnContent data={data} />;
}
