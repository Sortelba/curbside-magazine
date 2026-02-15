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
                        <div className="mt-4 space-y-2">
                            <Link href="/archive" className="block text-sm font-bold uppercase tracking-wide hover:underline text-muted-foreground hover:text-foreground">
                                {t("footer.archive")}
                            </Link>
                            <a href="https://sortelba.de/" target="_blank" rel="noopener noreferrer" className="block text-sm font-bold uppercase tracking-wide hover:underline text-muted-foreground hover:text-foreground">
                                {t("footer.learn")}
                            </a>
                        </div>
                    </div>
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
                </div>
                <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} SkateLife. {t("footer.rights")}
                </div>
            </div>
        </footer>
    );
}
