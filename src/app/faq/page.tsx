import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "FAQ",
    description: "Häufige Fragen zu CURBSIDE: woher die Skate-News kommen, wie du Events, Vereine oder Shops eintragen lässt und wie du uns erreichst.",
    alternates: { canonical: "/faq/" },
};

import Link from "next/link";
import { T } from "@/components/LanguageToggle";

export default function FAQPage() {
    const faqs = [1, 2, 3, 4, 5].map((n) => ({ q: `faq.q${n}`, a: `faq.a${n}` }));

    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12">
                FAQ
            </h1>

            <div className="space-y-8">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-muted p-8 rounded-3xl border border-border">
                        <h3 className="text-2xl font-black uppercase italic tracking-tight mb-4 text-primary">
                            <T k={faq.q} />
                        </h3>
                        <p className="font-medium leading-relaxed">
                            <T k={faq.a} />
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-16">
                <Link href="/" className="text-primary font-black uppercase italic hover:underline flex items-center gap-2">
                    &larr; <T k="archive.back_home" />
                </Link>
            </div>
        </main>
    );
}
