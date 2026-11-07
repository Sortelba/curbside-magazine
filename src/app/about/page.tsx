import AboutContent from '@/components/AboutContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Über CURBSIDE',
    description: 'Warum es CURBSIDE gibt: ein unabhängiges Skateboard-Magazin von Skatern für Skater – für die deutsche Skate-Szene, lokale Shops und Vereine.',
    alternates: { canonical: '/about/' },
};

export default function AboutPage() {
    return <AboutContent />;
}
