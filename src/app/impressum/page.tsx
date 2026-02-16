import Link from "next/link";

export default function ImpressumPage() {
    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12">
                Impressum
            </h1>

            <div className="prose prose-invert max-w-none space-y-8 font-medium">
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Angaben gemäß § 5 TMG</h2>
                    <p>
                        [Vorname Nachname]<br />
                        [Straße Hausnummer]<br />
                        [PLZ Stadt]
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Kontakt</h2>
                    <p>
                        Telefon: [Deine Telefonnummer]<br />
                        E-Mail: [Deine E-Mail-Adresse]
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">Redaktionell verantwortlich</h2>
                    <p>
                        [Vorname Nachname]<br />
                        [Straße Hausnummer]<br />
                        [PLZ Stadt]
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
            </div>

            <div className="mt-16">
                <Link href="/" className="text-primary font-black uppercase italic hover:underline flex items-center gap-2">
                    &larr; Zurück zur Startseite
                </Link>
            </div>
        </main>
    );
}
