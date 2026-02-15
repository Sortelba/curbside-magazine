"use client";

import { ExternalLink, Play, Image as ImageIcon, FileText, Instagram } from "lucide-react";
import { cn, getYoutubeEmbedUrl } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface PostCardProps {
    type: 'text' | 'image' | 'video' | 'link' | 'instagram-mix';
    title: string;
    content: string; // URL for image/video/link, text for text, comma-separated URLs or JSON for instagram-mix
    date: string;
    description?: string;
    tags?: string[];
    originalUrl?: string;
    translations?: {
        de: { title: string; content: string };
        en: { title: string; content: string };
    };
    source?: string;
    onClick?: () => void;
}

export default function PostCard({ type, title, content, date, description, tags, originalUrl, translations, source, onClick }: PostCardProps) {
    const { locale } = useLanguage();
    const linkUrl = originalUrl || (type === 'link' ? content : undefined);

    // Dynamic content based on locale
    const displayTitle = translations?.[locale]?.title || title;
    const displayDescription = translations?.[locale]?.content || description;

    // Truncate description for the card view
    const truncatedDesc = displayDescription && displayDescription.length > 150
        ? displayDescription.substring(0, 150) + "..."
        : displayDescription;

    const Wrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
        // If we have an onClick handler (for Modal), render as div with click
        if (onClick) {
            return (
                <div onClick={onClick} className={cn("cursor-pointer block hover:opacity-80 transition-opacity", className)}>
                    {children}
                </div>
            );
        }
        if (linkUrl && !onClick) {
            return (
                <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={cn("block hover:opacity-80 transition-opacity", className)}>
                    {children}
                </a>
            );
        }
        return <div className={className}>{children}</div>;
    };

    const getInstagramEmbedUrl = (url: string) => {
        const cleanUrl = url.trim().replace(/\/$/, '');
        return `${cleanUrl}/embed`;
    };

    // Function to render main content media for the grid card
    const renderMedia = () => {
        if (type === 'image' || (type === 'video' && onClick)) {
            // For video in grid, if it's a YT video, we can try to get thumb.
            if (type === 'video' && (content.includes('youtube') || content.includes('youtu.be'))) {
                const videoId = content.match(/v=([^&]+)/)?.[1] || content.match(/shorts\/([^?]+)/)?.[1] || content.split('/').pop();
                const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
                if (thumb) {
                    // eslint-disable-next-line @next/next/no-img-element
                    return <img src={thumb} alt={displayTitle} className="w-full h-48 object-cover transition-transform group-hover:scale-105" loading="lazy" />
                }
            }
            // Fallback for image
            if (type === 'image') {
                // eslint-disable-next-line @next/next/no-img-element
                return <img src={content} alt={displayTitle} className="w-full h-48 object-cover transition-transform group-hover:scale-105" loading="lazy" />
            }
        }
        return null;
    };

    // Main Card Return
    return (
        <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full flex flex-col group">

            {/* Media Header for Grid */}
            <Wrapper className="overflow-hidden relative bg-muted/20 min-h-[150px] flex items-center justify-center">
                {renderMedia() || (
                    // Fallback placeholder if no media logic hit (e.g. text only)
                    <div className="w-full h-48 flex items-center justify-center text-muted-foreground/20">
                        {type === 'text' && <FileText className="h-12 w-12" />}
                        {type === 'link' && <ExternalLink className="h-12 w-12" />}
                        {type === 'instagram-mix' && <Instagram className="h-12 w-12" />}
                        {type === 'video' && !onClick && <Play className="h-12 w-12" />} {/* Should not happen in grid usually */}
                    </div>
                )}

                {/* Overlay Icon */}
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-2 text-primary shadow-sm">
                    {type === 'text' && <FileText className="h-4 w-4" />}
                    {type === 'image' && <ImageIcon className="h-4 w-4" />}
                    {type === 'video' && <Play className="h-4 w-4" />}
                    {type === 'link' && <ExternalLink className="h-4 w-4" />}
                    {type === 'instagram-mix' && <Instagram className="h-4 w-4" />}
                </div>
            </Wrapper>

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span className="text-primary font-bold line-clamp-1 max-w-[50%]">{source || "News"}</span>
                    <span>•</span>
                    <span className="shrink-0">{date}</span>
                </div>

                <Wrapper className="mb-3 flex-1">
                    <h2 className="text-xl font-black uppercase tracking-tighter italic leading-tight group-hover:text-primary transition-colors line-clamp-3">
                        {displayTitle}
                    </h2>
                </Wrapper>

                {/* Truncated Text Preview */}
                {type === 'text' && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 font-mono">{content}</p>
                )}

                {/* For non-text, show description if available */}
                {type !== 'text' && truncatedDesc && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 max-h-[4.5em] overflow-hidden">{truncatedDesc}</p>
                )}

                {/* Read More / Action */}
                <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <button onClick={onClick} className="text-xs font-bold uppercase flex items-center gap-1 hover:gap-2 transition-all">
                        Read Story <ExternalLink className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </article>
    );
}
