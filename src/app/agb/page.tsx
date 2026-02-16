import Link from "next/link";

export default function AGBPage() {
    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12">
                AGB & Haftung
            </h1>

            <div className="prose prose-invert max-w-none space-y-8 font-medium">
                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">1. Geltungsbereich</h2>
                    <p>
                        Diese Bedingungen gelten für die Nutzung der Website CURBSIDE (curbside.sortelba.com). Mit dem Zugriff auf diese Website erklären Sie sich mit den folgenden Bedingungen einverstanden.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">2. Inhalte und Reposts</h2>
                    <p>
                        CURBSIDE ist eine Informationsplattform für Skateboarding. Wir kuratieren und "reposten" Inhalte aus verschiedenen Quellen (z.B. Instagram, YouTube, News-Feeds). Dabei achten wir darauf, die Originalquellen stets zu nennen. Die Urheberrechte der gezeigten Medien (Videos, Bilder) liegen bei den jeweiligen Erstellern bzw. Plattformen.
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
            </div>

            <div className="mt-16">
                <Link href="/" className="text-primary font-black uppercase italic hover:underline flex items-center gap-2">
                    &larr; Zurück zur Startseite
                </Link>
            </div>
        </main>
    );
}
