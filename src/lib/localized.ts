// Texte aus learn.json / community.json sind einsprachig gepflegt.
// Optional gibt es pro Feld eine Übersetzung: "description_en", "title_de" usw.
// Fehlt sie, wird der normale Text angezeigt.
export function loc(item: any, field: string, locale: string): string {
    return item?.[`${field}_${locale}`] || item?.[field] || "";
}
