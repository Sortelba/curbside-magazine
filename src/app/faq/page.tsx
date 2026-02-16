import Link from "next/link";

export default function FAQPage() {
    const faqs = [
        {
            q: "Was ist CURBSIDE?",
            a: "CURBSIDE ist ein leidenschaftliches Projekt, das die deutsche Skate-Szene vernetzen möchte. Wir bieten News, eine Skatemap, Infos zu Shops und Vereinen sowie eine Lern-Sektion."
        },
        {
            q: "Woher kommen die News?",
            a: "Wir nutzen automatisierte Scanner und manuelle Kuration, um die wichtigsten Updates von Skate-Magazinen, Brands und Pro-Skatern an einem Ort zu bündeln."
        },
        {
            q: "Kann ich meinen Verein hinzufügen?",
            a: "Ja, unbedingt! Nutze dafür einfach das Kontaktformular im Footer. Wir prüfen die Infos und fügen deinen Verein dann zur Community-Sektion hinzu."
        },
        {
            q: "Ist Curbside kostenlos?",
            a: "Ja, Curbside ist ein Non-Profit Projekt aus der Community für die Community."
        },
        {
            q: "Ich habe einen Fehler gefunden / möchte Feedback geben.",
            a: "Wir freuen uns über jede Nachricht! Schreib uns einfach über das Kontakt-Symbol im Footer."
        }
    ];

    return (
        <main className="container mx-auto pt-32 pb-20 px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-12">
                FAQ
            </h1>

            <div className="space-y-8">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-muted p-8 rounded-3xl border border-border">
                        <h3 className="text-2xl font-black uppercase italic tracking-tight mb-4 text-primary">
                            {faq.q}
                        </h3>
                        <p className="font-medium leading-relaxed">
                            {faq.a}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-16">
                <Link href="/" className="text-primary font-black uppercase italic hover:underline flex items-center gap-2">
                    &larr; Zurück zur Startseite
                </Link>
            </div>
        </main>
    );
}
