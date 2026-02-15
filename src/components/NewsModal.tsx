"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Calendar, Facebook, Twitter, Linkedin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect } from "react";

interface NewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: any;
}

export default function NewsModal({ isOpen, onClose, post }: NewsModalProps) {
    const { locale, t } = useLanguage();

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!post) return null;

    const displayTitle = post.translations?.[locale]?.title || post.title;
    const displayContent = post.translations?.[locale]?.content || post.description || post.title;

    // Naively parse "text" type content which might be markdown or just text
    // For now we just render it, splitting by newlines for paragraphs
    const paragraphs = displayContent.split('\n').filter((p: string) => p.trim().length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl z-50 scrollbar-hide"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-muted rounded-full transition-colors z-[60]"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Header Image (if available) */}
                        {post.type === 'image' && (
                            <div className="w-full h-64 md:h-80 overflow-hidden relative">
                                <img src={post.content} alt={displayTitle} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                            </div>
                        )}
                        {post.type === 'video' && (
                            <div className="w-full aspect-video bg-black">
                                <iframe
                                    src={post.content.replace('watch?v=', 'embed/')}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={displayTitle}
                                />
                            </div>
                        )}

                        <div className="p-8 md:p-12">
                            {/* Meta Info */}
                            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" /> {post.date}
                                </span>
                                <span>•</span>
                                <span className="text-primary font-bold">{post.source || "News"}</span>
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-8 leading-none">
                                {displayTitle}
                            </h2>

                            {/* Content */}
                            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                                {paragraphs.map((para: string, i: number) => {
                                    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                                    return (
                                        <p
                                            key={i}
                                            dangerouslySetInnerHTML={{
                                                __html: para.replace(linkRegex, '<a href="$2" target="_blank" class="text-primary hover:underline font-bold">$1</a>')
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            <div className="w-full h-px bg-border my-8 opacity-50" />

                            {/* Footer / Original Link */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <a
                                    href={post.originalUrl || post.content}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold uppercase text-sm hover:opacity-90 transition-opacity"
                                >
                                    Read Original <ExternalLink className="h-4 w-4" />
                                </a>

                                {/* Share Buttons (Mock) */}
                                <div className="flex gap-4">
                                    <button className="p-2 bg-muted rounded-full hover:bg-background border border-transparent hover:border-border transition-all">
                                        <Facebook className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 bg-muted rounded-full hover:bg-background border border-transparent hover:border-border transition-all">
                                        <Twitter className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 bg-muted rounded-full hover:bg-background border border-transparent hover:border-border transition-all">
                                        <Linkedin className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
