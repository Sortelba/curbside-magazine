"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Users, CalendarDays, MousePointerClick, Sun, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const input = "w-full p-3 bg-background border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";
const label = "block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest";
const card = "bg-card border-2 border-border rounded-[2rem] p-6";
const h3 = "text-sm font-black uppercase italic tracking-widest mb-4";

const RANGES = [
    { days: 7, label: "7 Tage" },
    { days: 30, label: "30 Tage" },
    { days: 90, label: "90 Tage" },
    { days: 365, label: "1 Jahr" },
];

// Ereignisse, die die Website mitzählt → lesbare Namen
const EVENT_LABEL: Record<string, string> = {
    "skatemap-geoeffnet": "Skatemap geöffnet",
    "skatemap-eintragen": "Skatemap: „Shop oder Spot eintragen“ geklickt",
    "kontakt-spot": "Kontakt: Skatespot eintragen",
    "kontakt-park": "Kontakt: Skatepark eintragen",
    "kontakt-shop": "Kontakt: Shop eintragen",
    "kontakt-news": "Kontakt: News teilen",
    "kontakt-event": "Kontakt: Event / Contest",
    "kontakt-club": "Kontakt: Verein eintragen",
    "kontakt-other": "Kontakt: Einfach Hallo sagen",
};
const SIZE_LABEL: Record<string, string> = {
    Phones: "Handy", "Large phones, small tablets": "Großes Handy / kleines Tablet",
    "Tablets and small laptops": "Tablet / kleiner Laptop", "Computer monitors": "Computer",
    "Computer monitors larger than HD": "Großer Bildschirm", "(unknown)": "Unbekannt",
};
const PAGE_LABEL: Record<string, string> = {
    "/": "Startseite (News)", "/community/": "Community", "/community/?bereich=skatemap": "Skatemap (Direktlink)",
    "/about/": "About", "/archive/": "Archiv", "/learn/": "Skaten lernen", "/faq/": "FAQ",
    "/impressum/": "Impressum", "/agb/": "AGB", "/datenschutz/": "Datenschutz",
};

const fmt = (n: number) => (n ?? 0).toLocaleString("de-DE");
const dayLabel = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

function BarList({ items, empty = "Noch keine Daten." }: { items: { name: string; count: number; href?: string }[]; empty?: string }) {
    const max = Math.max(1, ...items.map((i) => i.count));
    if (!items.length) return <p className="text-sm italic text-muted-foreground">{empty}</p>;
    return (
        <ul className="space-y-2">
            {items.map((i, idx) => (
                <li key={idx} className="relative">
                    <div className="absolute inset-y-0 left-0 rounded-lg bg-primary/10" style={{ width: `${(i.count / max) * 100}%` }} />
                    <div className="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        {i.href ? (
                            <a href={i.href} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{i.name}</a>
                        ) : (
                            <span className="truncate">{i.name}</span>
                        )}
                        <span className="font-black tabular-nums shrink-0">{fmt(i.count)}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Tile({ icon: Icon, title, value, sub, trend }: { icon: any; title: string; value: string; sub?: string; trend?: number | null }) {
    return (
        <div className={card}>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            </div>
            <p className="text-4xl font-black italic tracking-tighter mt-3 tabular-nums">{value}</p>
            {trend != null && Number.isFinite(trend) ? (
                <p className={cn("text-xs font-bold mt-2 flex items-center gap-1", trend >= 0 ? "text-green-600" : "text-red-500")}>
                    {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {trend >= 0 ? "+" : ""}{trend.toFixed(0)} % zum Zeitraum davor
                </p>
            ) : sub ? <p className="text-xs text-muted-foreground mt-2">{sub}</p> : null}
        </div>
    );
}

// Admin-Dashboard → Analytics
export default function ManageAnalytics({ keyStr }: { keyStr: string }) {
    const [days, setDays] = useState(30);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSetup, setShowSetup] = useState(false);
    const [code, setCode] = useState("");
    const [token, setToken] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<string | null>(null);

    const load = async (d = days, fresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/analytics?days=${d}${fresh ? `&t=${Date.now()}` : ""}`, { headers: { Authorization: `Bearer ${keyStr}` } });
            const json = await res.json().catch(() => ({}));
            setData(json);
            if (json.configured?.code) setCode((c) => c || json.configured.code);
            if (json.error) setError(json.error);
        } catch {
            setError("Server nicht erreichbar.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(days); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [keyStr, days]);

    const save = async () => {
        setSaving(true);
        setSaved(null);
        try {
            const res = await fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${keyStr}` },
                body: JSON.stringify({ action: "saveConfig", code, token }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.error) { setSaved(json.error || "Speichern fehlgeschlagen."); return; }
            setToken("");
            setShowSetup(false);
            setSaved("Gespeichert. Damit die Website mitzählt, einmal „Manuelles Update“ machen (Code muss zu GitHub).");
            await load(days, true);
        } finally {
            setSaving(false);
        }
    };

    const configured = data?.configured;
    const ready = configured?.code && configured?.hasToken;

    const setup = (
        <div className={cn(card, "space-y-5")}>
            <div>
                <h3 className={h3}>Besucherzählung einrichten</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Gezählt wird mit <b>GoatCounter</b>: kostenlos für nicht-kommerzielle Seiten, ohne Cookies, ohne Cookie-Banner, speichert keine IP-Adressen.
                </p>
            </div>
            <ol className="text-sm space-y-2 list-decimal pl-5 leading-relaxed">
                <li>Auf <a href="https://www.goatcounter.com/signup" target="_blank" rel="noopener noreferrer" className="font-bold underline">goatcounter.com/signup</a> ein Konto anlegen. Als <i>Code</i> z. B. <code className="bg-muted px-1 rounded">curbside</code> wählen → deine Seite heißt dann curbside.goatcounter.com.</li>
                <li>Oben im Menü auf <b>deinen Benutzernamen → API</b> klicken (direkt: <code className="bg-muted px-1 rounded">https://DEINCODE.goatcounter.com/user/api</code>), dort einen neuen Schlüssel mit dem Haken <b>Read statistics</b> erstellen und kopieren.</li>
                <li>Code und Schlüssel hier eintragen und speichern.</li>
                <li>Einmal <b>Manuelles Update</b> machen – ab dann zählt die Website mit.</li>
            </ol>
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className={label}>GoatCounter-Code</label>
                    <input className={input} placeholder="curbside" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div>
                    <label className={label}>API-Schlüssel {configured?.hasToken && "(schon gespeichert – nur zum Ändern ausfüllen)"}</label>
                    <input className={input} type="password" autoComplete="off" placeholder={configured?.hasToken ? "••••••••" : "Schlüssel einfügen"} value={token} onChange={(e) => setToken(e.target.value)} />
                </div>
            </div>
            <p className="text-xs text-muted-foreground">Der Code kommt in settings.json (er ist sowieso öffentlich). Der Schlüssel bleibt nur auf deinem Rechner in .env.local und geht nie zu GitHub.</p>
            <button
                onClick={save}
                disabled={saving || !code.trim() || (!token.trim() && !configured?.hasToken)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black uppercase italic text-xs disabled:opacity-40"
            >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Speichern
            </button>
        </div>
    );

    if (!data && loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const daily: { day: string; count: number }[] = data?.daily || [];
    const max = Math.max(1, ...daily.map((d) => d.count));
    const today = daily.length ? daily[daily.length - 1].count : 0;
    const trend = data?.previousTotal ? ((data.total - data.previousTotal) / data.previousTotal) * 100 : null;
    const pages: any[] = data?.pages || [];
    const posts = pages.filter((p) => p.path?.startsWith("/news/"));
    const other = pages.filter((p) => !p.path?.startsWith("/news/"));
    const site = "https://curbside.sortelba.com";
    const named = (rows: any[], map?: Record<string, string>) =>
        (rows || []).map((r) => ({ name: (map && map[r.name]) || r.name || "Unbekannt", count: r.count }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Analytics</h2>
                    <p className="text-sm text-muted-foreground mt-1">Wie viele Leute auf CURBSIDE sind und was sie sich anschauen.</p>
                </div>
                {ready && (
                    <div className="flex flex-wrap items-center gap-2">
                        {RANGES.map((r) => (
                            <button
                                key={r.days}
                                onClick={() => setDays(r.days)}
                                className={cn("px-4 py-2 rounded-full text-xs font-black uppercase italic border-2 transition-all",
                                    days === r.days ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}
                            >{r.label}</button>
                        ))}
                        <button onClick={() => load(days, true)} className="p-2 rounded-full border-2 border-border hover:bg-muted" title="Neu laden">
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </button>
                        <button onClick={() => setShowSetup((s) => !s)} className="p-2 rounded-full border-2 border-border hover:bg-muted" title="Einrichtung">
                            <Settings2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {saved && <p className="text-sm font-bold p-4 rounded-2xl bg-muted">{saved}</p>}
            {(!ready || showSetup) && setup}
            {error && <p className="text-sm font-bold p-4 rounded-2xl bg-red-500/10 text-red-600">{error}</p>}

            {ready && data?.daily && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Tile icon={Users} title={`Besucher (${RANGES.find((r) => r.days === days)?.label})`} value={fmt(data.total)} trend={trend} />
                        <Tile icon={CalendarDays} title="Ø pro Tag" value={fmt(Math.round(data.total / Math.max(1, days)))} sub={`Bester Tag: ${fmt(Math.max(0, ...daily.map((d) => d.count)))}`} />
                        <Tile icon={Sun} title="Heute" value={fmt(today)} sub="Besucher seit Mitternacht (UTC)" />
                        <Tile icon={MousePointerClick} title="Klicks" value={fmt(data.totalEvents)} sub="Skatemap & Kontakt-Auswahl" />
                    </div>

                    <div className={card}>
                        <h3 className={h3}>Besucher pro Tag</h3>
                        <div className="flex items-end gap-[2px] h-48">
                            {daily.map((d) => (
                                <div key={d.day} className="flex-1 h-full flex flex-col justify-end group relative">
                                    <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors min-h-[2px]" style={{ height: `${(d.count / max) * 100}%` }} />
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap rounded-lg bg-foreground text-background text-xs font-bold px-2 py-1 z-10">
                                        {dayLabel(d.day)}: {fmt(d.count)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {daily.length > 0 && (
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
                                <span>{dayLabel(daily[0].day)}</span>
                                <span>{dayLabel(daily[daily.length - 1].day)}</span>
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className={card}>
                            <h3 className={h3}>Beliebteste Beiträge</h3>
                            <BarList items={posts.slice(0, 15).map((p) => ({ name: (p.title || p.path).replace(/ \| CURBSIDE$/, ""), count: p.count, href: site + p.path }))} />
                        </div>
                        <div className={card}>
                            <h3 className={h3}>Seiten</h3>
                            <BarList items={other.slice(0, 15).map((p) => ({ name: PAGE_LABEL[p.path] || p.path, count: p.count, href: site + p.path }))} />
                        </div>
                        <div className={card}>
                            <h3 className={h3}>Woher die Leute kommen</h3>
                            <BarList items={named(data.refs).map((r) => ({ ...r, name: r.name === "Unbekannt" ? "Direkt / unbekannt" : r.name }))} />
                        </div>
                        <div className={card}>
                            <h3 className={h3}>Klicks auf der Seite</h3>
                            <BarList items={(data.events || []).map((e: any) => ({ name: EVENT_LABEL[e.path] || e.title || e.path, count: e.count }))} empty="Noch keine Klicks gezählt." />
                        </div>
                        <div className={card}>
                            <h3 className={h3}>Länder</h3>
                            <BarList items={named(data.locations)} />
                        </div>
                        <div className={card}>
                            <h3 className={h3}>Geräte</h3>
                            <BarList items={named(data.sizes, SIZE_LABEL)} />
                            <h3 className={cn(h3, "mt-6")}>Systeme</h3>
                            <BarList items={named(data.systems)} />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>Stand: {new Date(data.fetchedAt).toLocaleString("de-DE")}{data.cached ? " (zwischengespeichert, max. 5 Min.)" : ""} · Deine eigenen Besuche im Admin und auf localhost zählen nicht mit.</span>
                        <a href={data.dashboardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline">
                            Alles bei GoatCounter ansehen <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
