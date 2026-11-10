import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import SkatemapContent from "@/components/SkatemapContent";

export const metadata: Metadata = {
    title: "Skatemap – Skateparks, Spots & Skateshops",
    description: "Die CURBSIDE Skatemap: über 1.000 Skateparks, Street-Spots und Skateshops in Deutschland und Europa auf einer Karte.",
    alternates: { canonical: "/skatemap/" },
};

function readJson(name: string, fallback: any) {
    const filePath = path.join(process.cwd(), "src", "data", name);
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export default function SkatemapPage() {
    const map = readJson("map.json", { spots: [] });
    const community = readJson("community.json", { sections: [] });

    // Spots/Parks/Shops aus der Google-Karte + sichtbare Support-Shops mit Position
    const shopPoints = (community.sections?.find((s: any) => s.id === "sec_shops")?.items || [])
        .filter((i: any) => !i.hidden && typeof i.lat === "number" && typeof i.lng === "number")
        .map((i: any) => ({ id: i.id, name: i.name, type: "shop", lat: i.lat, lng: i.lng, address: i.address, url: i.url }));
    const points = [...(map.spots || []).filter((p: any) => !p.hidden), ...shopPoints];

    return <SkatemapContent points={points} />;
}
