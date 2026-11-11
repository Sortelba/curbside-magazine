"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Search, MapPin, Clock, ChevronRight, ExternalLink, Users, GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";
import { loc } from "@/lib/localized";

export default function CommunityContent({ data }: { data: any }) {
    const { locale, t } = useLanguage();
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedState, setSelectedState] = useState("");

    // Direktlink: /community/?bereich=shops öffnet gleich den Bereich.
    // Die Skatemap hat jetzt eine eigene Seite – alte Links dorthin weiterleiten.
    useEffect(() => {
        const bereich = new URLSearchParams(window.location.search).get("bereich") || "";
        // Skateshops stehen jetzt in der Skatemap
        if (bereich === "skatemap" || bereich === "shops") { window.location.replace("/skatemap/"); return; }
        const map: Record<string, string> = { shops: "sec_shops", vereine: "sec_clubs", projekte: "sec_projects", lernen: "sec_learn" };
        const id = map[bereich];
        if (id && (data.visibility || {})[id] !== false) setActiveSection(id);
    }, [data.visibility]);

    const visibility = data.visibility || {};
    const sections = [
        { id: "sec_clubs", name: t("community.clubs"), icon: Users },
        { id: "sec_projects", name: t("community.projects"), icon: Heart },
        { id: "sec_learn", name: t("community.skaten_lernen"), icon: GraduationCap }
    ].filter((s) => visibility[s.id] !== false); // im Admin ausgeblendete Bereiche weglassen

    const getTranslation = (id: string, defaultTitle: string) => {
        if (id === "sec_shops") return t("community.shops");
        if (id === "sec_clubs") return t("community.clubs");
        if (id === "sec_projects") return t("community.projects");
        return defaultTitle;
    };

    // Vereine: Filter nach Bundesland + Suche nach Name oder Stadt
    const clubs = useMemo(() => (data.sections.find((s: any) => s.id === "sec_clubs")?.items || []).filter((i: any) => !i.hidden), [data.sections]);
    const states = useMemo(() => {
        const counts = new Map<string, number>();
        for (const c of clubs) if (c.state) counts.set(c.state, (counts.get(c.state) || 0) + 1);
        return [...counts.entries()].sort((x, y) => x[0].localeCompare(y[0], "de"));
    }, [clubs]);
    const filteredClubs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return clubs.filter((c: any) =>
            (!selectedState || c.state === selectedState) &&
            (!q || `${c.name} ${c.city || ""} ${c.state || ""}`.toLowerCase().includes(q))
        );
    }, [clubs, searchQuery, selectedState]);

    const activeSectionData = useMemo(() => {
        return data.sections.find((s: any) => s.id === activeSection);
    }, [data.sections, activeSection]);

    return (
        <div className="container mx-auto pt-24 pb-12 px-4 min-h-[80vh] flex flex-col items-center justify-start relative overflow-hidden">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-16 md:mb-24 text-center">
                Community
            </h1>

            {/* Circles Navigation */}
            <div className="flex flex-wrap justify-center gap-16 md:gap-24 items-center">
                {sections.map((section) => {
                    const isLearnSection = section.id === "sec_learn";
                    const Component = isLearnSection ? "a" : motion.button;

                    return (
                        <Component
                            key={section.id}
                            {...(isLearnSection ? { href: "/learn" } : {})}
                            {...(!isLearnSection ? {
                                whileHover: { scale: 1.1, rotate: 5 },
                                whileTap: { scale: 0.95 },
                                onClick: () => setActiveSection(section.id)
                            } : {})}
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
                        </Component>
                    );
                })}
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {activeSection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="bg-card border-2 border-border rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                        >
                            {/* Header */}
                            <div className="p-6 md:p-8 border-b border-border flex justify-between items-center bg-muted/30">
                                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                                    {getTranslation(activeSection, activeSectionData?.title)}
                                </h2>
                                <button
                                    onClick={() => setActiveSection(null)}
                                    className="p-2 hover:bg-muted rounded-full transition-colors"
                                >
                                    <X size={32} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-foreground/20">
                                {activeSection === "sec_projects" && (
                                    <div className="space-y-12">
                                        <div className="text-center max-w-2xl mx-auto mb-12">
                                            <p className="text-lg text-muted-foreground italic">{t("community.projects_intro")}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {activeSectionData?.items.map((item: any) => (
                                                <a
                                                    key={item.id}
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group bg-muted rounded-3xl overflow-hidden border border-border hover:border-foreground transition-all flex flex-col shadow-sm hover:shadow-xl"
                                                >
                                                    {item.image && (
                                                        <div className="aspect-video bg-black overflow-hidden relative">
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{item.name}</h3>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="p-8 flex flex-col flex-1">
                                                        {!item.image && <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 group-hover:text-primary transition-colors">{item.name}</h3>}
                                                        <p className="text-muted-foreground mb-6 leading-relaxed text-sm flex-1">{loc(item, "description", locale)}</p>
                                                        <div className="flex items-center gap-2 text-xs font-black uppercase italic text-primary group-hover:translate-x-2 transition-transform mt-auto">
                                                            {t("community.learn_more")} <ChevronRight size={16} />
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeSection === "sec_clubs" && (
                                    <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative max-w-xl">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                            <input
                                                type="text"
                                                placeholder={t("community.club_search")}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-muted border-2 border-border rounded-xl py-3 pl-12 pr-4 focus:border-foreground outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[["", clubs.length] as [string, number], ...states].map(([state, count]) => (
                                                <button
                                                    key={state || "all"}
                                                    type="button"
                                                    onClick={() => setSelectedState(state)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full border-2 text-xs font-black uppercase tracking-wider transition-all",
                                                        selectedState === state
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {state || t("community.all_states")} <span className="opacity-60">{count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {filteredClubs.length === 0 && (
                                        <p className="text-center py-10 text-muted-foreground italic">{t("community.no_clubs")}</p>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredClubs.map((item: any) => (
                                            <div
                                                key={item.id}
                                                className="group bg-muted p-8 rounded-3xl border border-border hover:border-foreground transition-all flex flex-col justify-between shadow-sm hover:shadow-xl"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start gap-4 mb-4">
                                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">{item.name}</h3>
                                                        {item.url && (
                                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-background rounded-full transition-colors">
                                                                <ExternalLink size={20} />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3 font-bold uppercase tracking-widest text-muted-foreground text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin size={16} className="text-primary" />
                                                            <span>{[item.city, item.state].filter(Boolean).join(", ")}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.url ? (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-8 flex items-center gap-2 text-sm font-black uppercase italic text-primary group-hover:translate-x-2 transition-transform"
                                                    >
                                                        {t("community.to_website")} <ChevronRight size={18} />
                                                    </a>
                                                ) : (
                                                    <p className="mt-8 text-sm italic text-muted-foreground">{t("community.no_website")}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
