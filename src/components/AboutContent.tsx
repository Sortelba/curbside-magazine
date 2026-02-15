"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function AboutContent() {
    const { t } = useLanguage();

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12 text-center">
                {t("about.title")}
            </h1>

            <div className="space-y-8 text-lg md:text-xl leading-relaxed text-muted-foreground">
                <p className="border-l-4 border-foreground pl-6 py-2 italic font-medium text-foreground">
                    {t("about.p1")}
                </p>

                <p>{t("about.p2")}</p>

                <p className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-foreground py-4">
                    {t("about.p3")}
                </p>

                <p>{t("about.p4")}</p>

                <p>{t("about.p5")}</p>

                <div className="bg-muted p-8 rounded-lg border border-border">
                    <p className="mb-4">{t("about.p6")}</p>
                    <p className="font-bold text-foreground italic">{t("about.p7")}</p>
                </div>
            </div>
        </div>
    );
}
