"use client";

import { useEffect, useState } from "react";
import { Loader2, Map as MapIcon, Plus, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = { spot: "Spot", park: "Skatepark", shop: "Shop" };
const TYPE_COLOR: Record<string, string> = { park: "#2563eb", spot: "#f97316", shop: "#16a34a" };

const input = "w-full p-2 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all";
const label = "block text-[10px] font-black uppercase mb-1 text-muted-foreground tracking-widest";

// Admin-Dashboard → Community → Skatemap
export default function ManageSkatemap({ keyStr }: { keyStr: string }) {
    const [sources, setSources] = useState<any[]>([]);
    const [spots, setSpots] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    const [sourceUrl, setSourceUrl] = useState("");
    const [sourceType, setSourceType] = useState("spot");
    const [spot, setSpot] = useState({ name: "", type: "spot", link: "", address: "", description: "" });

    const call = async (method: "GET" | "POST", body?: any) => {
        const res = await fetch("/api/map", {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${keyStr}` },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        const data = await res.json().catch(() => ({}));
        if (data.sources) setSources(data.sources);
        if (data.spots) setSpots(data.spots);
        if (data.stats) setStats(data.stats);
        return { res, data };
    };

    useEffect(() => {
        call("GET").catch(() => setMessage({ ok: false, text: "Skatemap-Daten konnten nicht geladen werden." }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyStr]);

    const run = async (id: string, body: any, success: (data: any) => string) => {
        setBusy(id);
        setMessage(null);
        try {
            const { res, data } = await call("POST", body);
            if (!res.ok || data.error) {
                setMessage({ ok: false, text: data.error || data.summary || `Fehler (HTTP ${res.status})` });
                return false;
            }
            setMessage({ ok: data.ok !== false, text: data.ok === false ? `Gespeichert, aber der Scan ist fehlgeschlagen: ${data.summary}` : success(data) });
            return true;
        } catch {
            setMessage({ ok: false, text: "Server nicht erreichbar." });
            return false;
        } finally {
            setBusy(null);
        }
    };

    const scan = () => run("scan", { action: "scan" }, (d) => d.summary || "Scan fertig.");

    const addSource = async () => {
        if (!sourceUrl.trim()) return;
        if (await run("addSource", { action: "addSource", url: sourceUrl, type: sourceType }, (d) => `Karte hinzugefügt. ${d.summary || ""}`)) setSourceUrl("");
    };

    const deleteSource = (src: any) => {
        if (!confirm(`„${src.label}“ als Quelle entfernen? Die Spots daraus verschwinden von der Skatemap (in Google bleibt alles).`)) return;
        run(`del_${src.id}`, { action: "deleteSource", id: src.id }, (d) => `Quelle entfernt. ${d.summary || ""}`);
    };

    const addSpot = async () => {
        if (await run("addSpot", { action: "addSpot", spot }, (d) => `„${d.spot?.name}“ eingetragen. ${d.summary || ""}`)) {
            setSpot({ name: "", type: spot.type, link: "", address: "", description: "" });
        }
    };

    const deleteSpot = (s: any) => {
        if (!confirm(`„${s.name}“ löschen?`)) return;
        run(`del_${s.id}`, { action: "deleteSpot", id: s.id }, () => "Spot gelöscht.");
    };

    return (
        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-sm space-y-8">
            {/* Kopf: Zahlen + Scan */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-primary text-primary-foreground"><MapIcon className="h-5 w-5" /></div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tight">Skatemap</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                            {stats
                                ? `${stats.park} Skateparks · ${stats.spot} Spots · ${stats.shop} Shops aus den Karten (+ Shops von „Support Skate Shops“)${stats.updated ? ` · Stand ${stats.updated}` : ""}`
                                : "Lade…"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={scan}
                    disabled={!!busy}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-black uppercase italic text-sm hover:opacity-90 disabled:opacity-50"
                >
                    {busy === "scan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Karten jetzt scannen
                </button>
            </div>

            {message && (
                <p className={cn("text-sm font-bold p-3 rounded-lg", message.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                    {message.text}
                </p>
            )}

            {/* Quellen */}
            <section className="space-y-3">
                <div>
                    <h4 className="font-black uppercase tracking-tight">Google-Karten, die gescannt werden</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Bei My-Maps-Karten bestimmt der Ebenen-Name die Kategorie („…shop…“ → Shops, „…park…“ → Skateparks, sonst Spots).
                        Die Karte muss geteilt sein: „Jeder mit dem Link kann ansehen“. Gescannt wird auch automatisch bei jedem Autoscan.
                    </p>
                </div>
                <div className="space-y-2">
                    {sources.map((src) => (
                        <div key={src.id} className="flex items-center justify-between gap-3 bg-muted/20 border border-border rounded-xl p-3">
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{src.label}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {src.kind === "mymaps" ? "My Maps (Kategorie nach Ebene)" : `Liste → ${TYPE_LABEL[src.type] || src.type}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {src.url && (
                                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-lg" title="In Google öffnen">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                                <button onClick={() => deleteSource(src)} disabled={!!busy} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg" title="Quelle entfernen">
                                    {busy === `del_${src.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {sources.length === 0 && <p className="text-sm italic text-muted-foreground">Noch keine Karte eingetragen.</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                    <input className={input} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Link zur My-Maps-Karte oder Google-Maps-Liste" />
                    <select className={input} value={sourceType} onChange={(e) => setSourceType(e.target.value)} title="Nur für Google-Maps-Listen">
                        <option value="spot">Liste enthält Spots</option>
                        <option value="park">Liste enthält Skateparks</option>
                        <option value="shop">Liste enthält Shops</option>
                    </select>
                    <button onClick={addSource} disabled={!!busy || !sourceUrl.trim()} className="flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-bold text-sm disabled:opacity-50">
                        {busy === "addSource" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Karte hinzufügen
                    </button>
                </div>
            </section>

            {/* Eigene Spots */}
            <section className="space-y-3">
                <div>
                    <h4 className="font-black uppercase tracking-tight">Spot von Hand eintragen</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Google-Maps-Link einfügen (in Google Maps lange auf den Ort drücken → Teilen), oder Koordinaten bzw. Adresse.
                        Steht derselbe Ort später auch in einer Google-Karte, erscheint er trotzdem nur einmal.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className={label}>Name</label>
                        <input className={input} value={spot.name} onChange={(e) => setSpot({ ...spot, name: e.target.value })} placeholder="z. B. Hubba am Bahnhof" />
                    </div>
                    <div>
                        <label className={label}>Kategorie</label>
                        <select className={input} value={spot.type} onChange={(e) => setSpot({ ...spot, type: e.target.value })}>
                            <option value="spot">Spot</option>
                            <option value="park">Skatepark</option>
                            <option value="shop">Shop</option>
                        </select>
                    </div>
                    <div>
                        <label className={label}>Google-Maps-Link oder Koordinaten</label>
                        <input className={input} value={spot.link} onChange={(e) => setSpot({ ...spot, link: e.target.value })} placeholder="https://maps.app.goo.gl/… oder 49.01, 8.40" />
                    </div>
                    <div>
                        <label className={label}>Adresse (optional)</label>
                        <input className={input} value={spot.address} onChange={(e) => setSpot({ ...spot, address: e.target.value })} placeholder="Straße, PLZ Stadt" />
                    </div>
                    <div className="md:col-span-2">
                        <label className={label}>Beschreibung (optional)</label>
                        <textarea className={cn(input, "resize-none")} rows={2} value={spot.description} onChange={(e) => setSpot({ ...spot, description: e.target.value })} placeholder="Was gibt's da? z. B. 5 Stair mit Handrail, glatter Boden" />
                    </div>
                </div>
                <button onClick={addSpot} disabled={!!busy || (!spot.link.trim() && !spot.address.trim())} className="flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-bold text-sm disabled:opacity-50">
                    {busy === "addSpot" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Spot eintragen
                </button>

                {spots.length > 0 && (
                    <div className="space-y-2 pt-2">
                        <p className={label}>Von Hand eingetragen ({spots.length})</p>
                        {spots.map((s) => (
                            <div key={s.id} className="flex items-center justify-between gap-3 bg-muted/20 border border-border rounded-xl p-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: TYPE_COLOR[s.type] }} />
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{s.name}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {TYPE_LABEL[s.type]} · {s.address || `${s.lat}, ${s.lng}`}{s.added ? ` · ${s.added}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-muted rounded-lg" title="In Google Maps ansehen">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <button onClick={() => deleteSpot(s)} disabled={!!busy} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg" title="Löschen">
                                        {busy === `del_${s.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <p className="text-xs text-muted-foreground">
                Änderungen sind nach dem nächsten Veröffentlichen (oder Autoscan) auf der Homepage.
                Von Hand eingetragene Spots erscheinen nicht automatisch in My Maps – dafür gibt es die Datei „neue Spots“ (Claude fragen).
            </p>
        </div>
    );
}
