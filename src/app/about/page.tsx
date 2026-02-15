import AboutContent from '@/components/AboutContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About - CURBSIDE',
    description: 'Learn more about the mission and passion behind CURBSIDE.',
};

export default function AboutPage() {
    return <AboutContent />;
}
