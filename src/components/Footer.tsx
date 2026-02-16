"use client";

import { Github, Instagram, Youtube } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-muted py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <Link href="/" className="font-bold text-xl tracking-tighter uppercase italic text-foreground">
                            CURBSIDE
                        </Link>
                        <p className="text-muted-foreground text-sm mt-2">
                            Keep pushing. Support local shops.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                            <Link href="/archive" className="text-xs font-black uppercase italic tracking-wider hover:underline text-muted-foreground hover:text-foreground transition-colors">
                                {t("footer.archive")}
                            </Link>
                            <Link href="/faq" className="text-xs font-black uppercase italic tracking-wider hover:underline text-muted-foreground hover:text-foreground transition-colors">
                                {t("footer.faq")}
                            </Link>
                            <Link href="/impressum" className="text-xs font-black uppercase italic tracking-wider hover:underline text-muted-foreground hover:text-foreground transition-colors">
                                {t("footer.impressum")}
                            </Link>
                            <Link href="/agb" className="text-xs font-black uppercase italic tracking-wider hover:underline text-muted-foreground hover:text-foreground transition-colors">
                                {t("footer.agb")}
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-6">
                        <div className="flex space-x-6">
                            <a href="https://www.instagram.com/sortelba" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                <span className="sr-only">Instagram</span>
                                <Instagram className="h-6 w-6" />
                            </a>
                            <a href="https://www.youtube.com/@sortelba" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                <span className="sr-only">YouTube</span>
                                <Youtube className="h-6 w-6" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                <span className="sr-only">GitHub</span>
                                <Github className="h-6 w-6" />
                            </a>
                        </div>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal'))}
                            className="bg-foreground text-background px-6 py-2 rounded-full text-xs font-black uppercase italic tracking-wider hover:scale-105 transition-all"
                        >
                            {t("footer.contact")}
                        </button>
                    </div>
                </div>
                <div className="mt-12 border-t border-border pt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                    &copy; {new Date().getFullYear()} CURBSIDE. {t("footer.rights")}
                </div>
            </div>
        </footer>
    );
}
