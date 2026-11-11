"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function Navbar({ showCommunity = false, showSkatemap = true }: { showCommunity?: boolean; showSkatemap?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();
    // Oben ganz durchsichtig; erst beim Scrollen leicht milchig, damit das Menü lesbar bleibt
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks = [
        { name: t("nav.news"), href: "/" },
        ...(showSkatemap ? [{ name: t("nav.skatemap"), href: "/skatemap" }] : []),
        ...(showCommunity ? [{ name: t("nav.community"), href: "/community" }] : []),
    ];

    return (
        <nav className={cn(
            "sticky top-0 z-50 transition-colors duration-300",
            scrolled || isOpen ? "bg-background/35 backdrop-blur-sm" : "bg-transparent"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link href="/" className="font-bold text-2xl tracking-tighter uppercase italic text-foreground">
                            CURBSIDE
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-baseline space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-foreground hover:opacity-60 px-3 py-2 rounded-md text-sm font-medium transition-colors uppercase tracking-wide"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <LanguageToggle />
                            <ThemeToggle />

                        </div>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="bg-muted inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                        >
                            <span className="sr-only">{t("nav.open_menu")}</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden border-t border-border bg-background">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-foreground hover:opacity-60 block px-3 py-2 rounded-md text-base font-medium uppercase tracking-wide"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Mobile Theme & Language Switcher */}
                        <div className="px-3 py-4 border-t border-border mt-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">{t("nav.language")}</span>
                                <LanguageToggle />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">{t("nav.appearance")}</span>
                                <ThemeToggle />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
