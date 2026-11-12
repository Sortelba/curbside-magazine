"use client";

// Reiter „Auto-Posts“: Neue Spots, Parks, Skateshops (aus Skatemap-Scan / Skateshops) und neue Events
// landen hier als Vorschläge. Du wählst aus, was gepostet wird → ein Beitrag auf der lokalen Startseite.
// Online geht er mit „Jetzt veröffentlichen“ (= Publish to Git).
import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, Trash2, ExternalLink, MapPin, Calendar, Sparkles, X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type MapCandidate = { ref: string; name: string; type: "spot" | "park" | "shop"; lat: number; lng: number; address?: string; source?: string; added: string };
type EventCandidate = { ref: string; title: string; date: string; location: string; added: string };
type AutoPost = { id: string; title: string; image: string; kind: string; count: number; created: string; online: boolean };
type State = { candidates: { map: MapCandidate[]; events: EventCandidate[] }; posts: AutoPost[] };

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
    park: { label: "Skatepark", cls: "bg-blue-600" },
    spot: { label: "Spot", cls: "bg-orange-500" },
    shop: { label: "Skateshop", cls: "bg-green-600" },
};
const KIND_LABEL: Record<string, string> = {
    spot: "Street-Spot", park: "Skatepark", shop: "Skateshop",
    "map-summary": "Skatemap-Update", event: "Event", "event-summary": "Events-Update",
};

function useAutoPosts(keyStr: string, refreshKey?: string) {
    const [data, setData] = useState<State | null>(null);
    const load = useCallback(() => {
        fetch(`/api/auto-posts?key=${keyStr}`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setData(d))
            .catch(() => {});
    }, [keyStr]);
    // Neu laden beim Tab-Wechsel, beim Zurückkehren ins Fenster und alle 20 s
    // (Skatemap-Scan / Events speichern legen im Hintergrund neue Vorschläge an)
    useEffect(() => {
        load();
        const timer = setInterval(load, 20000);
        window.addEventListener("focus", load);
        return () => { clearInterval(timer); window.removeEventListener("focus", load); };
    }, [load, refreshKey]);
    return { data, setData, load };
}

/** Zahl für die Seitenleiste: offene Vorschläge + noch nicht veröffentlichte Auto-Posts */
export function useAutoPostCount(keyStr: string, refreshKey: string) {
    const { data } = useAutoPosts(keyStr, refreshKey);
    if (!data) return 0;
    return data.candidates.map.length + data.candidates.events.length + data.posts.filter((p) => !p.online).length;
}

/** Hinweis im Skatemap- bzw. Events-Reiter, wenn es neue Vorschläge gibt */
export function AutoPostsHint({ keyStr, kind, refreshKey, onOpen }: { keyStr: string; kind: "map" | "events"; refreshKey: string; onOpen: () => void }) {
    const { data } = useAutoPosts(keyStr, refreshKey);
    const n = data?.candidates[kind].length || 0;
    if (!n) return null;
    return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/5">
            <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                    <span className="font-black">{n} {kind === "map" ? (n === 1 ? "neuer Eintrag auf der Skatemap" : "neue Einträge auf der Skatemap") : (n === 1 ? "neues Event" : "neue Events")}</span>
                    {" "}– daraus kannst du einen Post für die Homepage machen.
                </p>
            </div>
            <button type="button" onClick={onOpen}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black uppercase italic text-xs tracking-widest hover:opacity-90">
                <PlusCircle className="h-4 w-4" /> Post erstellen
            </button>
        </div>
    );
}

export default function AutoPostsTab({ keyStr, onPublish }: { keyStr: string; onPublish: () => Promise<boolean> }) {
    const { data, setData, load } = useAutoPosts(keyStr);
    const [busy, setBusy] = useState<string | null>(null);
    const [created, setCreated] = useState<{ id: string; title: string } | null>(null);

    const call = async (body: any, tag: string) => {
        setBusy(tag);
        try {
            const res = await fetch("/api/auto-posts", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: keyStr, ...body }),
            });
            const d = await res.json().catch(() => null);
            if (!res.ok || !d) { alert(d?.error || "Fehler"); return; }
            setData(d);
            if (d.created) setCreated(d.created);
        } finally {
            setBusy(null);
        }
    };

    const publish = async () => {
        setBusy("publish");
        await onPublish();
        setBusy(null);
        load();
    };

    if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    const pending = data.posts.filter((p) => !p.online);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3"><Sparkles className="h-7 w-7" /> Auto-Posts</h2>
                <p className="text-muted-foreground mt-1">
                    Neue Spots, Skateparks, Skateshops und Events sammeln sich hier. Wähl aus, was auf die Homepage soll – daraus wird ein fertiger Post.
                    Er erscheint sofort auf der lokalen Startseite und geht online, wenn du veröffentlichst.
                </p>
            </div>

            {created && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-green-600 bg-green-600/10">
                    <p className="text-sm"><span className="font-black">Post erstellt:</span> {created.title}</p>
                    <div className="flex gap-2 shrink-0">
                        <a href={`/news/${created.id}/`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted font-black uppercase italic text-[11px] tracking-widest"><ExternalLink className="h-4 w-4" /> Ansehen</a>
                        <button type="button" onClick={() => setCreated(null)} className="p-2 rounded-xl hover:bg-muted" title="Schließen"><X className="h-4 w-4" /></button>
                    </div>
                </div>
            )}

            <CandidateCard
                title="Skatemap" icon={MapPin} kind="map" busy={busy} call={call}
                empty="Keine neuen Spots, Parks oder Shops. Neue Einträge kommen hier rein, sobald du die Karten scannst oder einen Skateshop mit Adresse speicherst."
                items={data.candidates.map.map((c) => ({
                    ref: c.ref, title: c.name, badge: TYPE_LABEL[c.type],
                    sub: [c.address, c.source].filter(Boolean).join(" · "),
                    href: `/skatemap/?at=${c.lat},${c.lng}`,
                }))}
                hint={(n) => n === 1 ? "Ein Post mit Kartenbild und Link genau zu diesem Ort." : `Ein Sammel-Post „Skatemap wurde aktualisiert“ mit allen ${n} Einträgen, ihren Orten, Kartenbild und Link zur Map.`}
            />

            <CandidateCard
                title="Events" icon={Calendar} kind="events" busy={busy} call={call}
                empty="Keine neuen Events. Sie kommen hier rein, sobald du im Events-Reiter ein Event einträgst oder gescannte Events übernimmst."
                items={data.candidates.events.map((c) => ({
                    ref: c.ref, title: c.title, badge: { label: "Event", cls: "bg-rose-600" },
                    sub: [c.date, c.location].filter(Boolean).join(" · "),
                }))}
                hint={(n) => n === 1 ? "Ein Post mit Flyer, Datum, Ort und Link." : `Ein Sammel-Post mit allen ${n} Terminen.`}
            />

            <div className={cn("p-6 rounded-3xl border-2 space-y-4", pending.length ? "border-primary" : "border-border bg-card")}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="font-black uppercase italic tracking-tight">Erstellte Auto-Posts</h3>
                        <p className="text-sm text-muted-foreground">
                            {pending.length ? `${pending.length} nur lokal – auf localhost schon sichtbar, online nach dem Veröffentlichen.` : "Alles veröffentlicht."}
                            {" "}Text ändern kannst du im Reiter „Live Posts“.
                        </p>
                    </div>
                    {pending.length > 0 && (
                        <div className="flex gap-2 shrink-0">
                            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted font-black uppercase italic text-xs tracking-widest hover:opacity-90">
                                <ExternalLink className="h-4 w-4" /> Startseite
                            </a>
                            <button type="button" onClick={publish} disabled={busy === "publish"}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-black uppercase italic text-xs tracking-widest hover:opacity-90 disabled:opacity-50">
                                {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Jetzt veröffentlichen
                            </button>
                        </div>
                    )}
                </div>
                {data.posts.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {data.posts.slice(0, 12).map((p) => (
                            <div key={p.id} className="flex gap-3 p-2 rounded-xl border-2 border-border bg-background">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.image} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover bg-muted" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                                        {KIND_LABEL[p.kind] || p.kind} · <span className={p.online ? "text-green-600" : "text-orange-500"}>{p.online ? "online" : "nur lokal"}</span>
                                    </p>
                                    <a href={`/news/${p.id}/`} target="_blank" rel="noopener noreferrer" className="text-sm font-black leading-tight line-clamp-2 hover:underline">{p.title}</a>
                                </div>
                                <button type="button" title="Post löschen" disabled={busy === p.id}
                                    onClick={() => confirm(`„${p.title}“ löschen?${p.online ? "\n\nDer Post ist schon online und verschwindet dort nach dem nächsten Veröffentlichen." : ""}`) && call({ action: "delete", id: p.id }, p.id)}
                                    className="self-start p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10">
                                    {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm italic text-muted-foreground">Noch keine Auto-Posts erstellt.</p>
                )}
            </div>
        </div>
    );
}

type Item = { ref: string; title: string; badge: { label: string; cls: string }; sub?: string; href?: string };

function CandidateCard({ title, icon: Icon, kind, items, empty, hint, busy, call }: {
    title: string; icon: any; kind: "map" | "events"; items: Item[]; empty: string;
    hint: (n: number) => string; busy: string | null; call: (body: any, tag: string) => Promise<void>;
}) {
    // Standard: alles ausgewählt; neu dazugekommene Einträge sind automatisch mit drin
    const [off, setOff] = useState<Set<string>>(new Set());
    const selected = items.filter((i) => !off.has(i.ref)).map((i) => i.ref);
    const toggle = (ref: string) => setOff((prev) => { const n = new Set(prev); if (n.has(ref)) n.delete(ref); else n.add(ref); return n; });
    const allOn = selected.length === items.length;

    return (
        <div className="p-6 rounded-3xl border-2 border-border bg-card space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-black uppercase italic tracking-tight flex items-center gap-2">
                    <Icon className="h-5 w-5" /> {title}
                    {items.length > 0 && <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] not-italic">{items.length} neu</span>}
                </h3>
                {items.length > 1 && (
                    <button type="button" onClick={() => setOff(allOn ? new Set(items.map((i) => i.ref)) : new Set())} className="text-xs font-bold underline text-muted-foreground hover:text-foreground">
                        {allOn ? "Keine auswählen" : "Alle auswählen"}
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">{empty}</p>
            ) : (
                <>
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-border rounded-xl border-2 border-border">
                        {items.map((i) => (
                            <label key={i.ref} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                                <input type="checkbox" checked={!off.has(i.ref)} onChange={() => toggle(i.ref)} className="h-4 w-4 accent-current shrink-0" />
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white shrink-0", i.badge.cls)}>{i.badge.label}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold truncate">{i.title}</span>
                                    {i.sub && <span className="block text-xs text-muted-foreground truncate">{i.sub}</span>}
                                </span>
                                {i.href && (
                                    <a href={i.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Auf der Karte ansehen" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </label>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">{selected.length ? hint(selected.length) : "Nichts ausgewählt."}</p>
                        <div className="flex gap-2 shrink-0">
                            <button type="button" disabled={!selected.length || !!busy}
                                onClick={() => confirm(`${selected.length} ${selected.length === 1 ? "Eintrag" : "Einträge"} verwerfen? Dafür wird dann kein Post erstellt.`) && call({ action: "dismiss", refs: selected }, `dismiss-${kind}`)}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted font-black uppercase italic text-xs tracking-widest hover:opacity-90 disabled:opacity-40">
                                {busy === `dismiss-${kind}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Verwerfen
                            </button>
                            <button type="button" disabled={!selected.length || !!busy}
                                onClick={() => call({ action: "create", kind, refs: selected }, `create-${kind}`)}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-black uppercase italic text-xs tracking-widest hover:opacity-90 disabled:opacity-40">
                                {busy === `create-${kind}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                {busy === `create-${kind}` ? "Post wird erstellt…" : `Post erstellen (${selected.length})`}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
