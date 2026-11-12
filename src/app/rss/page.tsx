import type { Metadata } from "next";
import RssContent from "@/components/RssContent";

export const metadata: Metadata = {
    title: "News abonnieren (RSS)",
    description: "CURBSIDE per RSS abonnieren: Mit einer Feed-App bekommst du jeden neuen Beitrag automatisch – auf Wunsch mit Benachrichtigung aufs Handy.",
    alternates: { canonical: "/rss/" },
};

export default function RssPage() {
    return <RssContent />;
}
