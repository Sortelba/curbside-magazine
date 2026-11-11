"use client";

import { Star, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// Bild für den Pick: eigenes Bild, sonst YouTube-Vorschaubild
function pickImage(post: any): string {
    const img = post.media?.images?.[0] || (post.type === "image" ? post.content : "");
    if (img) return img;
    const video = post.media?.videoUrl || (post.type === "video" ? post.content : "") || "";
    const id = String(video).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

// "Sortys Pick of the Week" – Kasten unter "Anstehende Events"
export default function PickOfTheWeek({ post, onOpen }: { post: any; onOpen: () => void }) {
    const { t, locale } = useLanguage();
    const title = post.translations?.[locale]?.title || post.title;
    const text = post.description || post.translations?.[locale]?.content || "";
    const image = pickImage(post);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group w-full text-left bg-card border-2 border-border rounded-3xl p-6 shadow-xl flex flex-col gap-4 hover:border-primary/50 transition-all"
        >
            <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Star className="text-primary w-5 h-5 fill-primary" />
                {t("pick.title")}
            </h2>
            {image && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
            )}
            <div>
                <h3 className="font-black uppercase italic tracking-tight leading-tight group-hover:text-primary transition-colors">{title}</h3>
                {text && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{text}</p>}
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary">
                {t("pick.open")} <ChevronRight size={12} />
            </span>
        </button>
    );
}
