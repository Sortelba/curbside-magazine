"use client";

import Link from "next/link";
import { ExternalLink, Calendar, Link2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// Inhalt eines Beitrags – im Modal auf der Startseite und auf der eigenen Beitragsseite (/news/[id]/)
export default function PostBody({ post, inModal = false }: { post: any; inModal?: boolean }) {
    const { locale, t } = useLanguage();
    const Heading = inModal ? "h2" : "h1";

    const displayTitle = post.translations?.[locale]?.title || post.title;
    const displayContent = post.translations?.[locale]?.content || post.description || post.title;
    const paragraphs = String(displayContent).split("\n").filter((p: string) => p.trim().length > 0);
    const videoUrl = post.media?.videoUrl || (post.type === "video" ? post.content : "");

    return (
        <>
            {/* Video zuerst, dann Bilder */}
            {videoUrl && (
                <div className="w-full aspect-video bg-black">
                    <iframe src={String(videoUrl).replace("watch?v=", "embed/")} className="w-full h-full" allowFullScreen title={displayTitle} />
                </div>
            )}

            {post.media?.images?.length > 0 ? (
                <div className="flex flex-col gap-4 bg-muted/5 border-b border-border">
                    {post.media.images.map((img: string, i: number) => (
                        <div key={i} className="w-full max-h-[500px] overflow-hidden">
                            <img src={img} alt={`${displayTitle} - ${i + 1}`} className="w-full h-full object-contain bg-black/5" />
                        </div>
                    ))}
                </div>
            ) : (
                post.type === "image" && (
                    <div className="w-full h-64 md:h-80 overflow-hidden relative">
                        <img src={post.content} alt={displayTitle} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                    </div>
                )
            )}

            <div className="p-8 md:p-12">
                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> {post.date}
                    </span>
                    <span>•</span>
                    <span className="text-primary font-bold">{post.source || "News"}</span>
                </div>

                <Heading className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-8 leading-none">
                    {displayTitle}
                </Heading>

                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                    {paragraphs.map((para: string, i: number) => (
                        <p
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: para.replace(
                                    /\[([^\]]+)\]\(([^)]+)\)/g,
                                    '<a href="$2" target="_blank" class="text-primary hover:underline font-bold">$1</a>'
                                ),
                            }}
                        />
                    ))}
                </div>

                <div className="w-full h-px bg-border my-8 opacity-50" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {inModal && post.id && (
                        <Link
                            href={`/news/${post.id}/`}
                            className="flex items-center gap-2 border border-border px-6 py-3 rounded-full font-bold uppercase text-sm hover:bg-muted transition-colors"
                        >
                            {t("news.open_page")} <Link2 className="h-4 w-4" />
                        </Link>
                    )}
                    <a
                        href={post.media?.externalLink || post.originalUrl || post.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold uppercase text-sm hover:opacity-90 transition-opacity"
                    >
                        {t("news.read_original")} <ExternalLink className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </>
    );
}
