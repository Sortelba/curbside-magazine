"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Upload, MapPin, Youtube, Link as LinkIcon, Info } from "lucide-react";

export function SpotContributeForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setStep(1);
            setIsSuccess(false);
        };
        window.addEventListener('open-spot-contribute', handleOpen);
        return () => window.removeEventListener('open-spot-contribute', handleOpen);
    }, []);
    const [isPicking, setIsPicking] = useState(false);

    const initialFormState = {
        name: "",
        contributor: "",
        category: "street",
        location: "",
        description: "",
        mediaUrl: "",
        youtubeUrl: "",
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleReset = () => {
        setFormData(initialFormState);
        setIsSuccess(false);
        setIsPicking(false);
    };

    // Dynamically import MapPicker
    const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData({ ...formData, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Build the email body
            const subject = `Spot Submission: ${formData.name}`;
            const body = `
Spot/Shop Name: ${formData.name}
Contributor: ${formData.contributor}
Category: ${formData.category}
Location/Address: ${formData.location}
Description: ${formData.description}
Media URL: ${formData.mediaUrl}
YouTube URL: ${formData.youtubeUrl}
            `.trim();

            const mailtoUrl = `mailto:sortelba@online.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;

            setIsSuccess(true);
        } catch (error) {
            console.error("Submission error:", error);
            alert("Fehler beim Vorbereiten der E-Mail.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full ${isPicking ? 'max-w-4xl' : 'max-w-lg'} bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-500`}
                >
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors z-[100]"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 md:p-12">
                        {isSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-12"
                            >
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Fast geschafft!</h2>
                                <p className="text-muted-foreground text-lg mb-8">Dein E-Mail Programm sollte sich nun öffnen. Sende die Mail einfach ab, damit wir deinen Spot prüfen können.</p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="px-8 py-4 bg-muted text-foreground border border-border font-black uppercase italic rounded-2xl hover:bg-muted/80 transition-all"
                                    >
                                        Noch einen Spot eintragen
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-8 py-4 bg-foreground text-background font-black uppercase italic rounded-2xl hover:translate-y-[-2px] transition-transform"
                                    >
                                        Zurück zur Karte
                                    </button>
                                </div>
                            </motion.div>
                        ) : isPicking ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <header className="mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Standort wählen</span>
                                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
                                        Klick auf <span className="text-muted-foreground/30">die Karte</span>
                                    </h2>
                                </header>

                                <div className="h-[50vh] min-h-[400px]">
                                    <MapPicker onLocationSelect={handleLocationSelect} />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsPicking(false)}
                                        className="px-8 py-4 bg-muted text-foreground font-black uppercase italic rounded-2xl hover:bg-muted/80 transition-all border border-border"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        onClick={() => setIsPicking(false)}
                                        className="px-8 py-4 bg-foreground text-background font-black uppercase italic rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                                    >
                                        Position übernehmen
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                <header className="mb-8">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Community Contribution</span>
                                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
                                        Spot <span className="text-muted-foreground/30">eintragen</span>
                                    </h2>
                                </header>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Spot / Shop Name</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Name des Spots..."
                                                className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dein Name / Alias</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Wird als Contributor gezeigt..."
                                                className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={formData.contributor}
                                                onChange={e => setFormData({ ...formData, contributor: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        {['street', 'park', 'shop'].map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat })}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase italic border transition-all ${formData.category === cat
                                                    ? "bg-foreground text-background border-foreground"
                                                    : "bg-muted text-muted-foreground border-border hover:border-foreground/30"
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Zusatzinfos (Öffnungszeiten, Details...)</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Beschreibe den Spot oder gib Infos zum Shop..."
                                            className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Wo genau? (Anschrift/Link)</label>
                                            <button
                                                type="button"
                                                onClick={() => setIsPicking(true)}
                                                className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                                            >
                                                <MapPin size={10} /> Auf Karte suchen
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <MapPin className="absolute left-5 top-4 text-muted-foreground" size={18} />
                                            <textarea
                                                required
                                                rows={2}
                                                placeholder="Adresse, Koordinaten oder Google Maps Link..."
                                                className="w-full bg-muted border border-border rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <LinkIcon size={12} /> Bild Link (optional)
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={formData.mediaUrl}
                                                onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                                <Youtube size={12} /> YT Link (optional)
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="Youtube Video..."
                                                className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={formData.youtubeUrl}
                                                onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            disabled={isSubmitting}
                                            type="submit"
                                            className="w-full py-4 bg-foreground text-background font-black uppercase italic rounded-[1.5rem] flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all shadow-xl disabled:opacity-50"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload size={18} />
                                                    Eintrag abschicken
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-medium">
                                        Durch das Absenden öffnet sich dein E-Mail Programm. Wir speichern keine Daten direkt auf dem Server.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
