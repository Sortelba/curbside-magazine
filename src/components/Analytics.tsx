"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Lädt den GoatCounter-Zähler und zählt jeden Seitenwechsel.
// Nicht auf localhost und nicht im Admin-Bereich – deine eigenen Tests zählen also nicht mit.
export default function Analytics({ code }: { code?: string }) {
    const pathname = usePathname();
    const loaded = useRef(false);

    const active = () =>
        Boolean(code) &&
        typeof window !== "undefined" &&
        !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname) &&
        !window.location.pathname.startsWith("/admin");

    useEffect(() => {
        if (!active() || loaded.current) return;
        loaded.current = true;
        // Automatisches Zählen aus, damit wir jeden Seitenwechsel selbst zählen können
        window.goatcounter = { no_onload: true };
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://gc.zgo.at/count.js";
        s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
        s.onload = () => window.goatcounter?.count?.({ path: location.pathname + location.search });
        document.head.appendChild(s);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    // Spätere Seitenwechsel innerhalb der Seite
    const first = useRef(true);
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        if (!active()) return;
        // kurz warten, bis der neue Seitentitel gesetzt ist
        const t = setTimeout(() => window.goatcounter?.count?.({ path: location.pathname + location.search, title: document.title }), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return null;
}
