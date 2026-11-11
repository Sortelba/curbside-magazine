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

import eventsData from "@/data/events.json";

const toLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDateKey = (value?: string) => {
    if (!value) return '';
    const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoMatch) return value;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return toLocalDateKey(parsed);
};

export default function EventsSidebar() {
    const { t, locale } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    // Tag mit mehreren Terminen: Liste aller Termine dieses Tages
    const [selectedDay, setSelectedDay] = useState<{ date: Date; events: Event[] } | null>(null);
    const MAX_PER_DAY = 2;

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        // Use imported data directly for better static support
        const data = eventsData as Event[];
        if (Array.isArray(data)) {
            const sorted = [...data].sort((a, b) => {
                const aKey = normalizeDateKey(a.startDateUtc || a.date);
                const bKey = normalizeDateKey(b.startDateUtc || b.date);
                if (!aKey && !bKey) return 0;
                if (!aKey) return 1;
                if (!bKey) return -1;
                return aKey.localeCompare(bKey);
            });
            setEvents(sorted);
            setLoading(false);
        }

        // Optional: Re-fetch in dev mode for live updates, but don't block
        if (process.env.NODE_ENV === 'development') {
            fetch('/api/events')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const sorted = [...data].sort((a, b) => {
                            const aKey = normalizeDateKey(a.startDateUtc || a.date);
                            const bKey = normalizeDateKey(b.startDateUtc || b.date);
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            return aKey.localeCompare(bKey);
                        });
                        setEvents(sorted);
                    }
                })
                .catch(err => console.error("Error fetching live events:", err));
        }
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
            const dayEvents = events.filter(e => normalizeDateKey(e.startDateUtc || e.date) === dateStr);

            const hidden = dayEvents.length - MAX_PER_DAY;
            const openDay = () => setSelectedDay({ date: new Date(year, month, day), events: dayEvents });

            days.push(
                <div
                    key={day}
                    onClick={dayEvents.length > 0 ? openDay : undefined}
                    className={cn(
                        "h-24 border border-border/50 p-1 md:p-2 relative bg-card overflow-hidden",
                        dayEvents.length > 0 && "cursor-pointer hover:bg-muted/30 transition-colors"
                    )}
                >
                    <span className="text-[10px] font-black text-muted-foreground/50">{day}</span>
                    <div className="flex flex-col gap-1 mt-1">
                        {dayEvents.slice(0, hidden > 0 ? MAX_PER_DAY - 1 : MAX_PER_DAY).map(event => (
                            <button
                                key={event.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                title={event.title}
                                className="text-[8px] md:text-[10px] p-1 bg-primary/10 text-primary border border-primary/20 rounded font-bold uppercase tracking-tighter truncate text-left hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                                {event.title}
                            </button>
                        ))}
                        {hidden > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); openDay(); }}
                                className="text-[8px] md:text-[10px] p-1 bg-primary text-primary-foreground rounded font-black uppercase tracking-tighter text-left hover:opacity-80 transition-all"
                            >
                                +{hidden + 1} {locale === 'de' ? 'Termine' : 'events'}
                            </button>
                        )}
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

    const renderMiniCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`mini-empty-${i}`} className="h-8 w-full" />);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvent = events.some(e => normalizeDateKey(e.startDateUtc || e.date) === dateStr);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            days.push(
                <div
                    key={`mini-${day}`}
                    className={cn(
                        "h-8 w-full flex items-center justify-center text-[10px] font-bold rounded-lg relative transition-all",
                        isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    )}
                >
                    {day}
                    {hasEvent && !isToday && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                </div>
            );
        }

        return days;
    };

    if (loading) return (
        <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-xl animate-pulse">
            <div className="h-6 w-32 bg-muted rounded mb-6" />
            <div className="h-48 bg-muted rounded-xl" />
        </div>
    );

    return (
        <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <Calendar className="text-primary w-5 h-5" />
                    {t("events.title")}
                </h2>
            </div>

            {/* Mini Calendar Widget */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCalendar(true)}
                className="bg-muted/30 border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group"
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase italic text-muted-foreground">
                        {currentMonth.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Info size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <div key={i} className="text-[8px] font-black text-muted-foreground/50 text-center mb-1">{d}</div>
                    ))}
                    {renderMiniCalendar()}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest text-primary animate-pulse">
                    <span>{t("events.show_calendar")}</span>
                    <ExternalLink size={8} />
                </div>
            </motion.div>

            {/* Day List Modal */}
            <AnimatePresence>
                {selectedDay && (
                    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border-2 border-border rounded-[2rem] w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between gap-4">
                                <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">
                                    {selectedDay.date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                <button onClick={() => setSelectedDay(null)} className="p-2 bg-muted hover:bg-muted-foreground/10 rounded-full transition-colors shrink-0">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                {selectedDay.events.map(event => (
                                    <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className="text-left p-4 rounded-2xl border border-border bg-muted/20 hover:border-primary/60 hover:bg-primary/5 transition-all"
                                    >
                                        <div className="font-black uppercase italic tracking-tight leading-tight">{event.title}</div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1 text-primary"><Calendar className="h-3 w-3" />{event.date}</span>
                                            <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{event.location}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">{t("events.details")}</h4>
                                            <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                                {selectedEvent.description || t("events.no_description")}
                                            </p>
                                        </div>

                                        {selectedEvent.link && (
                                            <a
                                                href={selectedEvent.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-transform"
                                            >
                                                {t("events.website")} <ExternalLink className="h-4 w-4" />
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
