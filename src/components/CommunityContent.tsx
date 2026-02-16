"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Youtube, X, Search, MapPin, Clock, ChevronRight, ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CommunityContent({ data }: { data: any }) {
    const { t } = useLanguage();
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedState, setSelectedState] = useState("");

    const sections = [
        { id: "sec_shops", name: t("community.shops"), icon: ShoppingBag },
        { id: "sec_clubs", name: t("community.clubs"), icon: Users },
        { id: "sec_projects", name: t("community.projects"), icon: Heart },
        { id: "youtubeskateboarding", name: t("community.youtube"), icon: Youtube }
    ];

    const getTranslation = (id: string, defaultTitle: string) => {
        if (id === "sec_shops") return t("community.shops");
        if (id === "sec_clubs") return t("community.clubs");
        if (id === "sec_projects") return t("community.projects");
        if (id === "youtubeskateboarding") return t("community.youtube");
        return defaultTitle;
    };

    // Get unique states for the filter
    const states = useMemo(() => {
        const shopSection = data.sections.find((s: any) => s.id === "sec_shops");
        if (!shopSection) return [];
        const uniqueStates = new Set(shopSection.items.map((item: any) => item.state).filter(Boolean));
        return Array.from(uniqueStates).sort() as string[];
    }, [data.sections]);

    const filteredShops = useMemo(() => {
        const section = data.sections.find((s: any) => s.id === "sec_shops");
        if (!section) return [];

        return section.items.filter((item: any) => {
            const query = searchQuery.trim().toLowerCase();
            const isNumeric = /^\d+$/.test(query);

            const nameMatch = item.name.toLowerCase().includes(query);
            let addressMatch = false;
            if (item.address) {
                const addressLower = item.address.toLowerCase();
                if (isNumeric) {
                    const plzMatch = item.address.match(/\d{5}/);
                    if (plzMatch && plzMatch[0].startsWith(query)) addressMatch = true;
                } else {
                    addressMatch = addressLower.includes(query);
                }
            }
            const stateMatch = (item.state && item.state.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query));

            const matchesSearch = nameMatch || addressMatch || stateMatch;
            const matchesStateFilter = !selectedState || item.state === selectedState;

            return matchesSearch && matchesStateFilter;
        });
    }, [data.sections, searchQuery, selectedState]);

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
                                {activeSection === "sec_shops" && (
                                    <div className="space-y-8">
                                        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                                            <div className="relative flex-grow">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder={t("community.search_placeholder")}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-muted border-2 border-border rounded-xl py-3 pl-12 pr-4 focus:border-foreground outline-none transition-all"
                                                />
                                            </div>
                                            <select
                                                value={selectedState}
                                                onChange={(e) => setSelectedState(e.target.value)}
                                                className="px-4 py-3 bg-muted border-2 border-border rounded-xl font-bold outline-none focus:border-foreground transition-all cursor-pointer"
                                            >
                                                <option value="">{t("community.all_states")}</option>
                                                {states.map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredShops.map((item: any) => (
                                                <a
                                                    key={item.id}
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group bg-muted p-6 rounded-3xl border border-border hover:border-foreground hover:shadow-xl transition-all flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start gap-4 mb-4">
                                                            <h3 className="text-xl font-black uppercase italic tracking-tight group-hover:text-primary transition-colors">{item.name}</h3>
                                                            <ExternalLink size={18} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                                                        </div>
                                                        <div className="space-y-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                            {item.state && <p className="text-primary">{item.state}</p>}
                                                            {item.address && (
                                                                <div className="flex items-start gap-2">
                                                                    <MapPin size={14} className="shrink-0" />
                                                                    <span className="normal-case tracking-normal font-medium">{item.address}</span>
                                                                </div>
                                                            )}
                                                            {item.hours && (
                                                                <div className="flex items-start gap-2">
                                                                    <Clock size={14} className="shrink-0" />
                                                                    <span className="normal-case tracking-normal font-medium">{item.hours}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                        {filteredShops.length === 0 && (
                                            <p className="text-center py-10 text-muted-foreground italic">Keine Shops in dieser Auswahl gefunden.</p>
                                        )}
                                    </div>
                                )}

                                {activeSection === "sec_projects" && (
                                    <div className="space-y-12">
                                        <div className="text-center max-w-2xl mx-auto mb-12">
                                            <p className="text-lg text-muted-foreground italic">Diese Projekte nutzen Skateboarding, um die Welt ein Stück besser zu machen. Support is everything!</p>
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
                                                        <p className="text-muted-foreground mb-6 leading-relaxed text-sm flex-1">{item.description}</p>
                                                        <div className="flex items-center gap-2 text-xs font-black uppercase italic text-primary group-hover:translate-x-2 transition-transform mt-auto">
                                                            Mehr erfahren <ChevronRight size={16} />
                                                        </div>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeSection === "sec_clubs" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {activeSectionData?.items.map((item: any) => (
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
                                                            <span>{item.city}, {item.state}</span>
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
                                                        Zur Website <ChevronRight size={18} />
                                                    </a>
                                                ) : (
                                                    <p className="mt-8 text-sm italic text-muted-foreground">Keine offizielle Website bekannt</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeSection === "youtubeskateboarding" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {activeSectionData?.items.map((chan: any) => (
                                            <a
                                                key={chan.id}
                                                href={chan.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group bg-muted p-6 rounded-3xl border border-border hover:border-foreground transition-all flex items-center justify-between shadow-sm hover:shadow-xl"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 border-border shrink-0 bg-background relative flex items-center justify-center text-2xl font-black italic uppercase">
                                                        <span className="text-muted-foreground/30 absolute">{chan.name.substring(0, 1)}</span>
                                                        {chan.image && (
                                                            <img src={chan.image} alt="" className="w-full h-full object-cover relative z-10" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight group-hover:text-red-600 transition-colors">{chan.name}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{chan.description}</p>
                                                    </div>
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
