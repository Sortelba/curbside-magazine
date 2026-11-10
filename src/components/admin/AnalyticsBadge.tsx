"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";

// Kleine Anzeige oben im Admin-Dashboard: holt beim Öffnen frische Besucherzahlen
export default function AnalyticsBadge({ keyStr, onOpen }: { keyStr: string; onOpen: () => void }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!keyStr) return;
        fetch("/api/analytics?days=7&fresh=1", { headers: { Authorization: `Bearer ${keyStr}` } })
            .then((r) => r.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [keyStr]);

    const ready = data?.configured?.code && data?.configured?.hasToken && data?.daily;
    const today = ready && data.daily.length ? data.daily[data.daily.length - 1].count : 0;
    const fmt = (n: number) => (n ?? 0).toLocaleString("de-DE");

    return (
        <button
            onClick={onOpen}
            title="Analytics öffnen"
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-muted hover:bg-muted/70 transition-colors text-left"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <BarChart3 className="h-4 w-4 text-primary" />}
            {ready ? (
                <span className="text-xs font-bold leading-tight">
                    <span className="block font-black text-sm tabular-nums">{fmt(today)} heute</span>
                    <span className="block text-muted-foreground tabular-nums">{fmt(data.total)} in 7 Tagen</span>
                </span>
            ) : (
                <span className="text-xs font-bold text-muted-foreground">{loading ? "Besucher…" : data?.error ? "Analytics: Fehler" : "Analytics einrichten"}</span>
            )}
        </button>
    );
}
