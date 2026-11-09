import type { Metadata } from "next";
import Link from "next/link";
import ByLocale from "@/components/ByLocale";
import { T } from "@/components/LanguageToggle";

export const metadata: Metadata = {
    title: "Impressum",
    description: "Impressum von CURBSIDE – Angaben gemäß § 5 TMG.",
    alternates: { canonical: "/impressum/" },
};

const de = (
    <>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Angaben gemäß § 5 TMG</h2>
                    <p>
                        Steffen Ortelbach<br />
                        Gaußstr. 8<br />
                        76131 Karlsruhe
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Kontakt</h2>
                    <p>
                        E-Mail: steffen.or@icloud.com
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Redaktionell verantwortlich</h2>
                    <p>
                        Steffen Ortelbach<br />
                        Gaußstr. 8<br />
                        76131 Karlsruhe
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">EU-Streitschlichtung</h2>
                    <p>
                        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                            https://ec.europa.eu/consumers/odr/
                        </a>.<br />
                        Unsere E-Mail-Adresse finden Sie oben im Impressum.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
                    <p>
                        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                    </p>
                </section>
    </>
);

const en = (
    <>
                <p className="text-sm italic text-muted-foreground">This is a translation for convenience. The German version is legally binding.</p>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Information pursuant to § 5 TMG</h2>
                    <p>
                        Steffen Ortelbach<br />
                        Gaußstr. 8<br />
                        76131 Karlsruhe
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Contact</h2>
                    <p>
                        Email: steffen.or@icloud.com
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Editorially responsible</h2>
                    <p>
                        Steffen Ortelbach<br />
                        Gaußstr. 8<br />
                        76131 Karlsruhe
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">EU dispute resolution</h2>
                    <p>
                        The European Commission provides a platform for online dispute resolution (ODR):
                        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                            https://ec.europa.eu/consumers/odr/
                        </a>.<br />
                        You can find our email address at the top of this legal notice.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Consumer dispute resolution</h2>
                    <p>
                        We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.
                    </p>
                </section>
    </>
);

export default function ImpressumPage() {
    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12">
                <ByLocale de="Impressum" en="Legal Notice" />
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
