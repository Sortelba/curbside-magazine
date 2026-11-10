"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, MessageSquare, ArrowLeft, Newspaper, CalendarDays, Users, Hand } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ROAD_SVG, SHOP_SVG, PARK_SVG } from "@/lib/mapIcons";
import { trackEvent } from "@/lib/analytics";

const MAIL = "steffen.or+curbside@gmail.com";

// Anliegen zur Auswahl – Betreff und Vorlage stehen in translations.json (contact.topics.<id>)
const TOPICS: { id: string; svg?: string; Icon?: any }[] = [
    { id: "spot", svg: ROAD_SVG },
    { id: "park", svg: PARK_SVG },
    { id: "shop", svg: SHOP_SVG },
    { id: "news", Icon: Newspaper },
    { id: "event", Icon: CalendarDays },
    { id: "club", Icon: Users },
    { id: "other", Icon: Hand },
];

export default function ContactModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [choosing, setChoosing] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        // Optional mit { detail: { choose: true } } direkt die Auswahl öffnen
        const handleOpen = (e: Event) => {
            setChoosing(Boolean((e as CustomEvent).detail?.choose));
            setIsOpen(true);
        };
        window.addEventListener('open-contact-modal', handleOpen);
        return () => window.removeEventListener('open-contact-modal', handleOpen);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setChoosing(false);
    };

    const mailHref = (id: string) =>
        `mailto:${MAIL}?subject=${encodeURIComponent(t(`contact.topics.${id}.subject`))}&body=${encodeURIComponent(t(`contact.topics.${id}.body`))}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-background border border-border rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-muted p-8 flex justify-between items-center border-b border-border shrink-0">
                            <div className="flex items-center gap-3">
                                {choosing && (
                                    <button
                                        onClick={() => setChoosing(false)}
                                        className="p-2 -ml-2 hover:bg-background rounded-xl transition-colors"
                                        aria-label={t("contact.back")}
                                        title={t("contact.back")}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                                        {choosing ? t("contact.choose_title") : t("contact.title")}
                                    </h2>
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
                                        {choosing ? t("contact.choose_subtitle") : t("contact.subtitle")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-3 hover:bg-background rounded-2xl transition-colors group"
                                aria-label="Close"
                            >
                                <X className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <div className="overflow-y-auto">
                            {!choosing ? (
                                <div className="p-10 space-y-8 text-center">
                                    <div className="space-y-6">
                                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2">
                                            <MessageSquare size={32} />
                                        </div>
                                        <p className="text-lg md:text-xl font-bold leading-relaxed text-foreground">
                                            {t("contact.question")}
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {t("contact.right_place")}
                                        </p>
                                        <p className="text-xl font-black uppercase italic tracking-tight text-primary">
                                            {t("contact.write_mail")}
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={() => setChoosing(true)}
                                            className="inline-flex items-center gap-4 bg-foreground text-background px-10 py-5 rounded-3xl font-black uppercase italic tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10 group"
                                        >
                                            <Mail className="group-hover:rotate-12 transition-transform" />
                                            {t("contact.send")}
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] pt-4">
                                        {MAIL}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-6 sm:p-8 space-y-3">
                                    {TOPICS.map(({ id, svg, Icon }) => (
                                        <a
                                            key={id}
                                            href={mailHref(id)}
                                            onClick={() => { trackEvent(`kontakt-${id}`, `Kontakt: ${id}`); setTimeout(handleClose, 300); }}
                                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-muted/40 hover:border-foreground hover:bg-muted transition-all group"
                                        >
                                            <span className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center bg-foreground text-background overflow-hidden">
                                                {svg ? (
                                                    <span className="h-11 w-11" dangerouslySetInnerHTML={{ __html: svg }} />
                                                ) : (
                                                    <Icon className="h-5 w-5" />
                                                )}
                                            </span>
                                            <span className="min-w-0 text-left">
                                                <span className="block font-black uppercase italic tracking-tight group-hover:text-primary transition-colors">
                                                    {t(`contact.topics.${id}.label`)}
                                                </span>
                                                <span className="block text-sm text-muted-foreground leading-snug">
                                                    {t(`contact.topics.${id}.hint`)}
                                                </span>
                                            </span>
                                        </a>
                                    ))}
                                    <p className="text-xs text-muted-foreground text-center pt-3">{t("contact.choose_note")}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
