"use client";

// Seite /rss/: erklärt, wie man die News per RSS abonniert (mit Kopier-Knopf für die Feed-Adresse)
import { useState } from "react";
import Link from "next/link";
import { Rss, Copy, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SITE_URL } from "@/lib/site";

const FEED_URL = `${SITE_URL}/feed.xml`;
const APPS = [
    { name: "Feedly", hint: "iPhone · Android · Web", url: "https://feedly.com/i/subscription/feed/" + encodeURIComponent(FEED_URL) },
    { name: "Inoreader", hint: "iPhone · Android · Web", url: "https://www.inoreader.com/?add_feed=" + encodeURIComponent(FEED_URL) },
    { name: "NetNewsWire", hint: "iPhone · Mac", url: "https://netnewswire.com/" },
    { name: "Feeder", hint: "Android", url: "https://play.google.com/store/apps/details?id=com.nononsenseapps.feeder.play" },
];

export default function RssContent() {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try { await navigator.clipboard.writeText(FEED_URL); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* Adresse steht ja im Feld */ }
    };

    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-4">
                <Rss className="h-10 w-10 md:h-14 md:w-14 shrink-0" /> {t("rss.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">{t("rss.intro")}</p>

            <div className="bg-muted p-6 md:p-8 rounded-3xl border border-border space-y-6">
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest mb-3">{t("rss.step1")}</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input readOnly value={FEED_URL} onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 min-w-0 px-4 py-3 rounded-xl border-2 border-border bg-background font-mono text-sm" />
                        <button type="button" onClick={copy}
                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-black uppercase italic text-xs tracking-widest hover:opacity-90">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? t("rss.copied") : t("rss.copy")}
                        </button>
                    </div>
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest mb-3">{t("rss.step2")}</h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {APPS.map((a) => (
                            <a key={a.name} href={a.url} target="_blank" rel="noopener noreferrer"
                                className="block p-4 rounded-xl border-2 border-border bg-background hover:border-foreground transition-colors">
                                <span className="block font-black uppercase italic">{a.name}</span>
                                <span className="block text-xs text-muted-foreground">{a.hint}</span>
                            </a>
                        ))}
                    </div>
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest mb-2">{t("rss.step3")}</h2>
                    <p className="text-sm text-muted-foreground">{t("rss.step3_text")}</p>
                </div>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">{t("rss.what")}</p>

            <div className="mt-12">
                <Link href="/" className="text-primary font-black uppercase italic hover:underline">&larr; {t("archive.back_home")}</Link>
            </div>
        </main>
    );
}
