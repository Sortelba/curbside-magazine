"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, MessageSquare } from "lucide-react";

export default function ContactModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-contact-modal', handleOpen);
        return () => window.removeEventListener('open-contact-modal', handleOpen);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

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
                        className="relative w-full max-w-xl bg-background border border-border rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="bg-muted p-8 flex justify-between items-center border-b border-border">
                            <div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                                    Kontakt & Vorschläge
                                </h2>
                                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
                                    Vereine, News oder Feedback
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-3 hover:bg-background rounded-2xl transition-colors group"
                            >
                                <X className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8 text-center">
                            <div className="space-y-6">
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2">
                                    <MessageSquare size={32} />
                                </div>
                                <p className="text-lg md:text-xl font-bold leading-relaxed text-foreground">
                                    Du hast Verbesserungsvorschläge, ein Contest findet statt und du möchtest, dass er eingetragen und gepostet wird?
                                </p>
                                <p className="text-muted-foreground leading-relaxed">
                                    Oder möchtest du einen Spot in die Map eintragen oder sonst etwas zur Homepage beitragen? Dann bist du hier genau richtig!
                                </p>
                                <p className="text-xl font-black uppercase italic tracking-tight text-primary">
                                    Schreib mir einfach eine Mail!
                                </p>
                            </div>

                            <div className="pt-4">
                                <a
                                    href="mailto:steffen.or+curbside@gmail.com"
                                    className="inline-flex items-center gap-4 bg-foreground text-background px-10 py-5 rounded-3xl font-black uppercase italic tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10 group"
                                >
                                    <Mail className="group-hover:rotate-12 transition-transform" />
                                    Mail Senden
                                </a>
                            </div>

                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] pt-4">
                                steffen.or+curbside@gmail.com
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
