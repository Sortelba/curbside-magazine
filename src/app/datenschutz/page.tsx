import type { Metadata } from "next";
import Link from "next/link";
import ByLocale from "@/components/ByLocale";
import { T } from "@/components/LanguageToggle";

export const metadata: Metadata = {
    title: "Datenschutz",
    description: "Datenschutzerklärung von CURBSIDE – welche Daten beim Besuch der Seite verarbeitet werden.",
    alternates: { canonical: "/datenschutz/" },
};

const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-2xl font-black uppercase italic tracking-tight text-primary">{children}</h2>
);

const de = (
    <>
        <section>
            <H>Verantwortlich</H>
            <p>
                Steffen Ortelbach<br />
                Gaußstr. 8<br />
                76131 Karlsruhe<br />
                E-Mail: steffen.or@icloud.com
            </p>
        </section>
        <section>
            <H>Kurz gesagt</H>
            <p>
                CURBSIDE setzt keine Cookies, hat keine Anmeldung und keine Werbung. Wir zählen anonym, wie viele Leute die Seite besuchen.
                Einige Inhalte (Karte, Videos) werden von anderen Anbietern geladen – das steht unten genauer.
            </p>
        </section>
        <section>
            <H>Hosting</H>
            <p>
                Die Website liegt bei GitHub Pages (GitHub Inc., USA). Beim Aufruf verarbeitet GitHub technisch notwendige Daten wie deine IP-Adresse,
                Uhrzeit und den aufgerufenen Inhalt, um die Seite auszuliefern und vor Angriffen zu schützen. Grundlage ist unser berechtigtes Interesse an
                einer sicheren, funktionierenden Website (Art. 6 Abs. 1 lit. f DSGVO). GitHub ist nach dem EU-US Data Privacy Framework zertifiziert.
            </p>
        </section>
        <section>
            <H>Besucherzählung (GoatCounter)</H>
            <p>
                Um zu sehen, welche Beiträge gelesen werden und wie viele Leute die Seite besuchen, nutzen wir GoatCounter (goatcounter.com).
                GoatCounter setzt keine Cookies und speichert keine IP-Adressen. Gezählt werden die aufgerufene Seite, die Seite, von der du kommst,
                Browser, Betriebssystem, Bildschirmgröße und das Land (aus der IP-Adresse ermittelt, die danach nicht gespeichert wird).
                Damit derselbe Besuch nicht doppelt zählt, wird kurzzeitig ein anonymer Prüfwert gebildet, der nach wenigen Stunden ungültig wird.
                Ein Rückschluss auf dich als Person ist nicht möglich. Grundlage ist unser berechtigtes Interesse, die Seite zu verbessern
                (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
        </section>
        <section>
            <H>Skatemap (OpenStreetMap)</H>
            <p>
                Die Karte wird aus Kartenkacheln von OpenStreetMap (OpenStreetMap Foundation, Großbritannien) geladen. Dabei wird deine IP-Adresse an
                deren Server übertragen. Die Kacheln werden erst geladen, wenn du die Skatemap öffnest. Links zu Orten öffnen Google Maps erst, wenn du sie anklickst.
            </p>
        </section>
        <section>
            <H>Eingebettete Videos und Beiträge</H>
            <p>
                Manche Beiträge enthalten Videos von YouTube (Google) oder Beiträge von Instagram (Meta). Wenn du so einen Beitrag öffnest, lädt dein
                Browser die Inhalte direkt von diesen Anbietern, die dabei deine IP-Adresse erhalten und eigene Cookies setzen können.
                Bilder in News-Beiträgen können von der Seite der jeweiligen Quelle geladen werden.
            </p>
        </section>
        <section>
            <H>Kontakt per E-Mail</H>
            <p>
                Wenn du uns über „Kontakt &amp; Vorschläge“ schreibst, öffnet sich dein eigenes Mailprogramm. Deine Nachricht und deine E-Mail-Adresse
                nutzen wir nur, um dein Anliegen zu bearbeiten (z. B. einen Spot einzutragen), und löschen sie, wenn sie nicht mehr gebraucht werden.
            </p>
        </section>
        <section>
            <H>Deine Rechte</H>
            <p>
                Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.
                Schreib dafür einfach eine Mail an die Adresse oben. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren,
                z. B. beim Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg.
            </p>
        </section>
        <p className="text-sm text-muted-foreground">Stand: November 2026</p>
    </>
);

const en = (
    <>
        <section>
            <H>Controller</H>
            <p>
                Steffen Ortelbach<br />
                Gaußstr. 8<br />
                76131 Karlsruhe, Germany<br />
                Email: steffen.or@icloud.com
            </p>
        </section>
        <section>
            <H>In short</H>
            <p>
                CURBSIDE uses no cookies, has no sign-up and no ads. We count anonymously how many people visit the site.
                Some content (map, videos) is loaded from other providers – details below.
            </p>
        </section>
        <section>
            <H>Hosting</H>
            <p>
                The website is hosted on GitHub Pages (GitHub Inc., USA). When you visit, GitHub processes technically necessary data such as your
                IP address, time and requested content to deliver the site and protect it from attacks. Legal basis is our legitimate interest in a
                secure, working website (Art. 6(1)(f) GDPR). GitHub is certified under the EU-US Data Privacy Framework.
            </p>
        </section>
        <section>
            <H>Visitor statistics (GoatCounter)</H>
            <p>
                To see which posts are read and how many people visit, we use GoatCounter (goatcounter.com). GoatCounter sets no cookies and does not
                store IP addresses. It records the page visited, the referring page, browser, operating system, screen size and country (derived from the
                IP address, which is not stored afterwards). To avoid counting the same visit twice, a short-lived anonymous hash is created and discarded
                after a few hours. It cannot be used to identify you. Legal basis is our legitimate interest in improving the site
                (Art. 6(1)(f) GDPR).
            </p>
        </section>
        <section>
            <H>Skatemap (OpenStreetMap)</H>
            <p>
                The map loads map tiles from OpenStreetMap (OpenStreetMap Foundation, UK), which receives your IP address. Tiles are only loaded once you
                open the Skatemap. Links to places open Google Maps only when you click them.
            </p>
        </section>
        <section>
            <H>Embedded videos and posts</H>
            <p>
                Some posts contain videos from YouTube (Google) or posts from Instagram (Meta). When you open such a post, your browser loads the content
                directly from these providers, who receive your IP address and may set their own cookies. Images in news posts may be loaded from the
                original source's website.
            </p>
        </section>
        <section>
            <H>Contact by email</H>
            <p>
                If you write to us via "Contact &amp; Suggestions", your own mail app opens. We only use your message and email address to handle your
                request (e.g. adding a spot) and delete them when they are no longer needed.
            </p>
        </section>
        <section>
            <H>Your rights</H>
            <p>
                You have the right to access, rectification, erasure, restriction of processing, data portability and objection. Just send an email to
                the address above. You can also lodge a complaint with a data protection supervisory authority, e.g. the State Commissioner for Data
                Protection and Freedom of Information of Baden-Württemberg.
            </p>
        </section>
        <p className="text-sm text-muted-foreground">Last updated: November 2026</p>
    </>
);

export default function DatenschutzPage() {
    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12">
                <ByLocale de="Datenschutz" en="Privacy" />
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
