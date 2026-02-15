"use client";

import { useLanguage } from "@/context/LanguageContext";
import PostCard from "@/components/PostCard";
import EventsSidebar from "@/components/EventsSidebar";
import NewsModal from "@/components/NewsModal";
import { useState } from "react";

export default function HomeContent({ posts }: { posts: any[] }) {
    const { t } = useLanguage();
    const [selectedPost, setSelectedPost] = useState<any>(null);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
                        {posts.map((post: any, index: number) => (
                            <div key={index} className="h-full">
                                <PostCard
                                    {...post}
                                    onClick={() => setSelectedPost(post)}
                                />
                            </div>
                        ))}
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
