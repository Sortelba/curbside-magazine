// Symbole der Skatemap (auch im Kontaktfenster benutzt)
// Eigenes Straßen-Symbol für Street-Spots: orange Runde, Straße in Perspektive mit Mittelstreifen
export const ROAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <circle cx="16" cy="16" r="14.5" fill="#f97316" stroke="#fff" stroke-width="2.5"/>
  <g stroke="#fff" stroke-linecap="round" fill="none">
    <path d="M13.2 8.5 L8 24.5" stroke-width="2.2"/>
    <path d="M18.8 8.5 L24 24.5" stroke-width="2.2"/>
    <path d="M16 9 V11" stroke-width="1.6"/>
    <path d="M16 14 V17" stroke-width="1.9"/>
    <path d="M16 20.5 V24.5" stroke-width="2.2"/>
  </g>
</svg>`;

// Eigenes Laden-Symbol für Skateshops: grüne Runde, Ladenfront mit gestreifter Markise und Tür
export const SHOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <circle cx="16" cy="16" r="14.5" fill="#16a34a" stroke="#fff" stroke-width="2.5"/>
  <path d="M8.5 10.5 L10 7.5 H22 L23.5 10.5 Z" fill="#fff"/>
  <path d="M8.5 10.5 a1.875 1.875 0 0 0 3.75 0 a1.875 1.875 0 0 0 3.75 0 a1.875 1.875 0 0 0 3.75 0 a1.875 1.875 0 0 0 3.75 0 Z" fill="#fff"/>
  <path d="M10 13.2 V24 H22 V13.2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
  <rect x="17.2" y="16.5" width="3.2" height="7.5" fill="#fff"/>
  <rect x="11.6" y="16.5" width="3.8" height="3.2" fill="#fff"/>
</svg>`;

// Eigenes Skatepark-Symbol: blaue Runde, Halfpipe mit Plattformen und Coping
export const PARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <circle cx="16" cy="16" r="14.5" fill="#2563eb" stroke="#fff" stroke-width="2.5"/>
  <path d="M6.5 11.5 H10 Q10 20.5 16 20.5 Q22 20.5 22 11.5 H25.5 V23 H6.5 Z" fill="#fff"/>
  <path d="M5.8 11.5 H10.4 M21.6 11.5 H26.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

