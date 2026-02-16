"use client";

import { useLanguage } from "@/context/LanguageContext";
import PostCard from "@/components/PostCard";
import EventsSidebar from "@/components/EventsSidebar";
import NewsModal from "@/components/NewsModal";
import { useState, useMemo } from "react";
import { MoveLeft, MoveRight, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomeContent({ posts }: { posts: any[] }) {
    const { t } = useLanguage();
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 12;

    const displayedPosts = useMemo(() => {
        if (!isExpanded) {
            return posts.slice(0, 6);
        }
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        return posts.slice(startIndex, startIndex + PAGE_SIZE);
    }, [posts, isExpanded, currentPage]);

    const totalPages = Math.ceil(posts.length / PAGE_SIZE);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-12 text-center">
                <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                    {t("hero.title")}
                </h1>
                <p className="text-xl md:text-2xl font-light text-muted-foreground max-w-2xl mx-auto">
                    {t("hero.description")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12 relative">
                {/* News Feed - 3/4 of layout */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr mb-12">
                        <AnimatePresence mode="popLayout">
                            {displayedPosts.map((post: any, index: number) => (
                                <motion.div
                                    key={post.id || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="h-full"
                                >
                                    <PostCard
                                        {...post}
                                        onClick={() => setSelectedPost(post)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Controls Section */}
                    <div className="flex flex-col items-center justify-center py-8 border-t border-border/50">
                        {!isExpanded ? (
                            posts.length > 6 && (
                                <button
                                    onClick={() => setIsExpanded(true)}
                                    className="group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:scale-105 transition-all font-black uppercase italic tracking-widest shadow-xl shadow-primary/20"
                                >
                                    <span>{t("news.showMore") || "Mehr News anzeigen"}</span>
                                    <ChevronDown className="group-hover:translate-y-1 transition-transform" size={20} />
                                </button>
                            )
                        ) : (
                            <div className="flex items-center gap-6">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(1, prev - 1));
                                        window.scrollTo({ top: 300, behavior: 'smooth' });
                                    }}
                                    className="p-4 bg-muted/50 rounded-2xl hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-muted/50 disabled:hover:text-inherit transition-all shadow-sm"
                                >
                                    <MoveLeft size={24} />
                                </button>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black italic uppercase tracking-tighter opacity-50">{t("news.page") || "Seite"}</span>
                                    <span className="text-2xl font-black italic uppercase italic tracking-tighter text-primary">{currentPage}</span>
                                    <span className="text-sm font-black italic uppercase tracking-tighter opacity-50">{t("news.of") || "von"} {totalPages}</span>
                                </div>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => {
                                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                        window.scrollTo({ top: 300, behavior: 'smooth' });
                                    }}
                                    className="p-4 bg-muted/50 rounded-2xl hover:bg-primary hover:text-primary-foreground disabled:opacity-30 disabled:hover:bg-muted/50 disabled:hover:text-inherit transition-all shadow-sm"
                                >
                                    <MoveRight size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Events Sidebar - 1/4 of layout */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <EventsSidebar />
                    </div>
                </div>
            </div>

            {/* Modal for Details */}
            <NewsModal
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
                post={selectedPost}
            />
        </div>
    );
}
