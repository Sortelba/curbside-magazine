"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Calendar, MapPin, ExternalLink, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Event {
    id: string;
    title: string;
    date: string;
    startDateUtc?: string;
    location: string;
    link?: string;
    description?: string;
    flyerUrl?: string;
}

export default function EventsSidebar() {
    const { t, locale } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Sort by date if possible
                    const sorted = [...data].sort((a, b) => {
                        if (!a.startDateUtc) return 1;
                        if (!b.startDateUtc) return -1;
                        return new Date(a.startDateUtc).getTime() - new Date(b.startDateUtc).getTime();
                    });
                    setEvents(sorted);
                }
            })
            .catch(err => console.error("Error fetching events:", err))
            .finally(() => setLoading(false));
    }, []);

    const nextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(currentMonth.getMonth() + 1);
        setCurrentMonth(next);
    };

    const prevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(currentMonth.getMonth() - 1);
        setCurrentMonth(prev);
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        // Adjust for Monday start if needed, but standard 0-6 (Sun-Sat) is easier for JS
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-muted/5 border border-border/50" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.startDateUtc === dateStr);

            days.push(
                <div key={day} className="h-24 border border-border/50 p-2 relative bg-card overflow-hidden">
                    <span className="text-[10px] font-black text-muted-foreground/50">{day}</span>
                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[calc(100%-1rem)]">
                        {dayEvents.map(event => (
                            <button
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className="text-[8px] md:text-[10px] p-1 bg-primary/10 text-primary border border-primary/20 rounded font-bold uppercase tracking-tighter truncate text-left hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                                {event.title}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    if (loading) return (
        <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-xl animate-pulse">
            <div className="h-6 w-32 bg-muted rounded mb-6" />
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-muted rounded-xl" />
                ))}
            </div>
        </div>
    );

    const limitedEvents = events.slice(0, 5);

    return (
        <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-xl">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                <Calendar className="text-primary" />
                {t("events.title")}
            </h2>

            <div className="space-y-4 mb-6">
                {limitedEvents.length > 0 ? (
                    limitedEvents.map((event, index) => (
                        <motion.div
                            key={event.id || index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedEvent(event)}
                            className="group p-4 bg-muted/30 border border-border rounded-2xl hover:border-primary/50 transition-all hover:shadow-md cursor-pointer relative"
                        >
                            <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors pr-6">
                                {event.title}
                            </h3>

                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span>{event.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{event.location}</span>
                                </div>
                            </div>

                            <div className="absolute top-4 right-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                                <Info size={16} />
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <p className="text-center py-8 text-muted-foreground italic text-sm">
                        {t("events.no_events")}
                    </p>
                )}
            </div>

            <button
                onClick={() => setShowCalendar(true)}
                className="w-full py-4 bg-muted border-2 border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center gap-2"
            >
                <Calendar className="h-4 w-4" />
                {t("events.show_calendar")}
            </button>

            {/* Event Detail Modal */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border-2 border-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="relative p-6 md:p-8 border-b border-border bg-muted/20">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-6 right-6 p-2 bg-muted hover:bg-muted-foreground/10 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-4 pr-12">
                                    {selectedEvent.title}
                                </h2>
                                <div className="flex flex-wrap gap-4 text-sm font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Calendar className="h-4 w-4" />
                                        <span>{selectedEvent.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{selectedEvent.location}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Details</h4>
                                            <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                                {selectedEvent.description || "Keine weitere Beschreibung vorhanden."}
                                            </p>
                                        </div>

                                        {selectedEvent.link && (
                                            <a
                                                href={selectedEvent.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-transform"
                                            >
                                                Event Website <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>

                                    {selectedEvent.flyerUrl && (
                                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-border shadow-lg">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={selectedEvent.flyerUrl}
                                                alt={`Flyer: ${selectedEvent.title}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Calendar Modal */}
            <AnimatePresence>
                {showCalendar && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCalendar(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border-2 border-border rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Calendar Header */}
                            <div className="p-6 md:p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                                    <Calendar className="text-primary h-8 w-8" />
                                    {currentMonth.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' })}
                                </h2>

                                <div className="flex items-center gap-2">
                                    <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronLeft /></button>
                                    <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronRight /></button>
                                    <button
                                        onClick={() => setShowCalendar(false)}
                                        className="ml-4 p-2 bg-muted hover:bg-muted-foreground/10 rounded-full transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                                <div className="grid grid-cols-7 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/50">
                                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                                        <div key={i} className="bg-muted/50 p-2 text-center text-[10px] font-black text-muted-foreground uppercase">{d}</div>
                                    ))}
                                    {renderCalendar()}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
