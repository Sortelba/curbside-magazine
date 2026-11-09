import type { Metadata } from "next";
import Link from "next/link";
import ByLocale from "@/components/ByLocale";
import { T } from "@/components/LanguageToggle";

export const metadata: Metadata = {
    title: "AGB & Haftung",
    description: "Allgemeine Geschäftsbedingungen und Haftungshinweise von CURBSIDE.",
    alternates: { canonical: "/agb/" },
};

const de = (
    <>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">1. Geltungsbereich</h2>
                    <p>
                        Diese Bedingungen gelten für die Nutzung der Website CURBSIDE (curbside.sortelba.com). Mit dem Zugriff auf diese Website erklären Sie sich mit den folgenden Bedingungen einverstanden.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">2. Inhalte und Reposts</h2>
                    <p>
                        CURBSIDE ist eine Informationsplattform für Skateboarding. Wir kuratieren und &quot;reposten&quot; Inhalte aus verschiedenen Quellen (z.B. Instagram, YouTube, News-Feeds). Dabei achten wir darauf, die Originalquellen stets zu nennen. Die Urheberrechte der gezeigten Medien (Videos, Bilder) liegen bei den jeweiligen Erstellern bzw. Plattformen.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">3. Haftungsausschluss (Disclaimer)</h2>
                    <p className="font-bold">Haftung für Inhalte</p>
                    <p>
                        Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                    </p>
                    <p className="font-bold">Haftung für Links</p>
                    <p>
                        Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">4. Urheberrecht</h2>
                    <p>
                        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">5. Community-Einsendungen</h2>
                    <p>
                        Wenn Nutzer Vereine oder News vorschlagen, behalten wir uns das Recht vor, diese nach Prüfung zu veröffentlichen oder abzulehnen. Es besteht kein Anspruch auf Veröffentlichung.
                    </p>
                </section>
    </>
);

const en = (
    <>
                <p className="text-sm italic text-muted-foreground">This is a translation for convenience. The German version is legally binding.</p>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">1. Scope</h2>
                    <p>
                        These terms apply to the use of the CURBSIDE website (curbside.sortelba.com). By accessing this website, you agree to the following terms.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">2. Content and reposts</h2>
                    <p>
                        CURBSIDE is an information platform for skateboarding. We curate and &quot;repost&quot; content from various sources (e.g. Instagram, YouTube, news feeds) and always make sure to credit the original sources. The copyright of the media shown (videos, images) remains with the respective creators or platforms.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">3. Disclaimer</h2>
                    <p className="font-bold">Liability for content</p>
                    <p>
                        As a service provider, we are responsible for our own content on these pages in accordance with § 7 (1) TMG and general laws. According to §§ 8 to 10 TMG, however, we are not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
                    </p>
                    <p className="font-bold">Liability for links</p>
                    <p>
                        Our website contains links to external third-party websites whose content we have no influence on. We therefore cannot accept any liability for this external content. The respective provider or operator of the linked pages is always responsible for their content.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">4. Copyright</h2>
                    <p>
                        The content and works created by the site operators on these pages are subject to German copyright law. Reproduction, editing, distribution and any kind of use beyond the limits of copyright law require the written consent of the respective author or creator.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">5. Community submissions</h2>
                    <p>
                        When users suggest clubs or news, we reserve the right to publish or reject them after review. There is no entitlement to publication.
                    </p>
                </section>
    </>
);

export default function AGBPage() {
    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12">
                <ByLocale de="AGB & Haftung" en="Terms & Liability" />
            </h1>

            <div className="prose prose-invert max-w-none space-y-8 font-medium">
                <ByLocale de={de} en={en} />
            </div>

            <div className="mt-16">
                <Link href="/" className="text-primary font-black uppercase italic hover:underline flex items-center gap-2">
                    &larr; <T k="archive.back_home" />
                </Link>
            </div>
        </main>
    );
}
