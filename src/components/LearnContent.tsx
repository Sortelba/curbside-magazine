"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Users, Dices, Link as LinkIcon, X, Search, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "pro">("beginner");
    const [randomTrick, setRandomTrick] = useState<string | null>(null);
    const [coachSearch, setCoachSearch] = useState("");

    const sections = [
        { id: "basics", name: t("nav.learn_basics"), icon: Play, color: "bg-blue-500" },
        { id: "coach", name: t("nav.learn_coach"), icon: Users, color: "bg-emerald-500" },
        { id: "randomizer", name: t("nav.learn_randomizer"), icon: Dices, color: "bg-purple-500" },
        { id: "channels", name: t("nav.learn_channels"), icon: LinkIcon, color: "bg-orange-500" }
    ];

    const generateTrick = () => {
        const tricks = data.randomizer[difficulty];
        const newTrick = tricks[Math.floor(Math.random() * tricks.length)];
        setRandomTrick(newTrick);
    };

    const filteredCoaches = useMemo(() => {
        const query = coachSearch.toLowerCase();
        if (!query) return data.coaches;
        return data.coaches.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.location.toLowerCase().includes(query) ||
            c.state.toLowerCase().includes(query)
        );
    }, [coachSearch, data.coaches]);

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
                        onClick={() => {
                            setActiveSection(section.id);
                            if (section.id === "randomizer" && !randomTrick) generateTrick();
                        }}
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
                                {activeSection === "basics" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {data.basics.map(basic => (
                                            <div key={basic.id} className="group bg-muted rounded-2xl overflow-hidden border border-border">
                                                <div className="aspect-video bg-black flex items-center justify-center">
                                                    {basic.videoUrl.includes("youtube") ? (
                                                        <iframe
                                                            src={basic.videoUrl}
                                                            className="w-full h-full"
                                                            allowFullScreen
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground italic">Video Preview</span>
                                                    )}
                                                </div>
                                                <div className="p-6">
                                                    <h3 className="text-xl font-bold uppercase mb-2">{basic.title}</h3>
                                                    <p className="text-muted-foreground">{basic.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeSection === "coach" && (
                                    <div className="space-y-8">
                                        <div className="relative max-w-lg mx-auto">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                            <input
                                                type="text"
                                                placeholder={t("nav.coach_search_placeholder")}
                                                value={coachSearch}
                                                onChange={(e) => setCoachSearch(e.target.value)}
                                                className="w-full bg-muted border-2 border-border rounded-xl py-3 pl-12 pr-4 focus:border-foreground outline-none transition-all text-lg"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {filteredCoaches.map(coach => (
                                                <div key={coach.id} className="bg-muted p-6 rounded-2xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-2xl font-black uppercase italic tracking-tight">{coach.name}</h3>
                                                        <p className="text-muted-foreground font-medium">{coach.location}, {coach.state}</p>
                                                        <p className="mt-2 text-sm">{coach.description}</p>
                                                    </div>
                                                    <a
                                                        href={`mailto:${coach.contact}`}
                                                        className="bg-foreground text-background px-6 py-2 rounded-lg font-bold uppercase italic hover:scale-105 transition-transform text-center"
                                                    >
                                                        Kontakt
                                                    </a>
                                                </div>
                                            ))}
                                            {filteredCoaches.length === 0 && (
                                                <p className="text-center py-10 text-muted-foreground italic">Keine Coaches in dieser Region gefunden.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeSection === "randomizer" && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-12">
                                        <div className="flex bg-muted p-1.5 rounded-2xl border border-border">
                                            {(["beginner", "intermediate", "pro"] as const).map(lvl => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setDifficulty(lvl)}
                                                    className={cn(
                                                        "px-6 py-2 rounded-xl text-sm font-black uppercase italic transition-all",
                                                        difficulty === lvl ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {t(`nav.difficulty_${lvl}`)}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative flex flex-col items-center">
                                            <motion.div
                                                key={randomTrick}
                                                initial={{ y: 20, opacity: 0, rotateX: -90 }}
                                                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                                                className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-center py-8"
                                            >
                                                {randomTrick}
                                            </motion.div>
                                            <button
                                                onClick={generateTrick}
                                                className="mt-8 flex items-center gap-3 bg-foreground text-background px-10 py-5 rounded-full text-2xl font-black uppercase italic hover:scale-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                                            >
                                                <RefreshCw size={28} />
                                                {t("nav.randomizer_generate")}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeSection === "channels" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {data.channels.map(chan => (
                                            <a
                                                key={chan.id}
                                                href={chan.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group bg-muted p-8 rounded-3xl border border-border hover:border-foreground transition-all flex items-center justify-between"
                                            >
                                                <div>
                                                    <h3 className="text-2xl font-black uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">{chan.name}</h3>
                                                    <p className="text-muted-foreground mt-1">{chan.description}</p>
                                                </div>
                                                <ChevronRight className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" size={32} />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
