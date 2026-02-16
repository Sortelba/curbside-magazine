"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Coach {
    id: string;
    name: string;
    location: string;
    state: string;
    contact: string;
    description: string;
}

export default function CoachesSection({ coaches }: { coaches: Coach[] }) {
    const { t } = useLanguage();
    const [coachSearch, setCoachSearch] = useState("");

    const filteredCoaches = useMemo(() => {
        const query = coachSearch.toLowerCase();
        if (!query) return coaches;
        return coaches.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.location.toLowerCase().includes(query) ||
            c.state.toLowerCase().includes(query)
        );
    }, [coachSearch, coaches]);

    return (
        <div className="space-y-8">
            <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                    type="text"
                    placeholder={t("nav.coach_search_placeholder") || "Search coaches..."}
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
    );
}
