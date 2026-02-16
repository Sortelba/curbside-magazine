"use client";

import Link from "next/link";
import { Menu, X, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { locale, setLocale, t } = useLanguage();

    const navLinks = [
        { name: t("nav.news"), href: "/" },
        { name: t("nav.map"), href: "/map" },
        { name: t("nav.community"), href: "/community" },
    ];

    return (
        <nav className="bg-background border-b border-border sticky top-0 z-50">
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
                                    className="text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md text-sm font-medium transition-colors uppercase tracking-wide"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />

                            {/* Right side Language Switcher */}
                            <div className="flex bg-muted rounded-md p-0.5 border border-border">
                                <button
                                    onClick={() => setLocale("de")}
                                    className={cn(
                                        "px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors",
                                        locale === "de" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    DE
                                </button>
                                <button
                                    onClick={() => setLocale("en")}
                                    className={cn(
                                        "px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors",
                                        locale === "en" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="bg-muted inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
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
                                className="text-muted-foreground hover:text-foreground hover:bg-muted block px-3 py-2 rounded-md text-base font-medium uppercase tracking-wide"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Mobile Theme & Language Switcher */}
                        <div className="px-3 py-4 border-t border-border mt-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Appearance:</span>
                                <ThemeToggle />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Language:</span>
                                <div className="flex bg-muted rounded-md p-0.5 border border-border">
                                    <button
                                        onClick={() => { setLocale("de"); setIsOpen(false); }}
                                        className={cn(
                                            "px-4 py-2 text-xs font-bold uppercase rounded transition-colors",
                                            locale === "de" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        DE
                                    </button>
                                    <button
                                        onClick={() => { setLocale("en"); setIsOpen(false); }}
                                        className={cn(
                                            "px-4 py-2 text-xs font-bold uppercase rounded transition-colors",
                                            locale === "en" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        EN
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
