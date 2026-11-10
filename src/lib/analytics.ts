// Besucherzählung mit GoatCounter (ohne Cookies, keine personenbezogenen Daten).
// Der Code der Seite steht in settings.json → "analytics": { "goatcounter": "<code>" }.
declare global {
    interface Window { goatcounter?: any }
}

/** Seitenaufruf zählen – z. B. wenn ein Beitrag im Fenster auf der Startseite geöffnet wird */
export function trackView(path: string, title?: string) {
    if (typeof window === "undefined") return;
    try {
        window.goatcounter?.count?.({ path, title: title || document.title });
    } catch { /* Zähler nicht geladen (Werbeblocker, lokal) */ }
}

/** Ereignis zählen, z. B. "kontakt-spot" oder "skatemap-geoeffnet" */
export function trackEvent(name: string, title?: string) {
    if (typeof window === "undefined") return;
    try {
        window.goatcounter?.count?.({ path: name, title: title || name, event: true });
    } catch { /* ignorieren */ }
}
