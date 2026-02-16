"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Users, Dices, Link as LinkIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import BasicsSection from "@/components/learn/BasicsSection";
import CoachesSection from "@/components/learn/CoachesSection";
import RandomizerSection from "@/components/learn/RandomizerSection";
import ChannelsSection from "@/components/learn/ChannelsSection";

interface LearnData {
    basics: Array<{ id: string; title: string; description: string; videoUrl: string }>;
    coaches: Array<{ id: string; name: string; location: string; state: string; contact: string; description: string }>;
    randomizer: {
        beginner: string[];
        intermediate: string[];
        pro: string[];
    };
    channels: Array<{ id: string; name: string; description: string; url: string }>;
}

export default function LearnContent({ data }: { data: LearnData }) {
    const { t } = useLanguage();
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const sections = [
        { id: "basics", name: t("nav.learn_basics"), icon: Play, color: "bg-blue-500" },
        { id: "coach", name: t("nav.learn_coach"), icon: Users, color: "bg-emerald-500" },
        { id: "randomizer", name: t("nav.learn_randomizer"), icon: Dices, color: "bg-purple-500" },
        { id: "channels", name: t("nav.learn_channels"), icon: LinkIcon, color: "bg-orange-500" }
    ];

    return (
        <div className="container mx-auto pt-24 pb-12 px-4 min-h-[80vh] flex flex-col items-center justify-start relative overflow-hidden">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-16 md:mb-24 text-center">
                {t("nav.learn")}
            </h1>

            {/* Circles Navigation */}
            <div className="flex flex-wrap justify-center gap-16 md:gap-24 items-center">
                {sections.map((section) => (
                    <motion.button
                        key={section.id}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveSection(section.id)}
                        className="group flex flex-col items-center gap-8 cursor-pointer"
                    >
                        <div className={cn(
                            "w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center shadow-2xl relative transition-all duration-300",
                            "bg-card border-4 border-foreground hover:bg-foreground hover:text-background",
                            "after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-foreground/5 group-hover:after:scale-110 group-hover:after:opacity-0 after:transition-all"
                        )}>
                            <section.icon size={48} className="md:size-20" />
                        </div>
                        <span className="text-lg md:text-xl font-black uppercase italic tracking-wider text-center max-w-[200px] leading-tight">
                            {section.name}
                        </span>
                    </motion.button>
                ))}
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {activeSection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="bg-card border-2 border-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Header */}
                            <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-muted/50">
                                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                                    {sections.find(s => s.id === activeSection)?.name}
                                </h2>
                                <button
                                    onClick={() => setActiveSection(null)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X size={32} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10">
                                {activeSection === "basics" && <BasicsSection basics={data.basics} />}
                                {activeSection === "coach" && <CoachesSection coaches={data.coaches} />}
                                {activeSection === "randomizer" && <RandomizerSection randomizer={data.randomizer} />}
                                {activeSection === "channels" && <ChannelsSection channels={data.channels} />}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
