import { GoogleGenerativeAI } from "@google/generative-ai";

// Schlüssel kommt aus .env.local (GEMINI_API_KEY=...). Nach dem Eintragen den Server neu starten.
const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

// Modelle, in dieser Reihenfolge probiert (Stand Nov. 2026, Gratis-Stufe).
// "...-latest" zeigt immer auf das neueste Modell; ist eins überlastet (503) oder
// abgeschaltet (404), wird das nächste genommen.
const MODELS = [
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
];

// Gratis-Stufe erlaubt nur wenige Anfragen pro Minute → kleine Pause zwischen Artikeln.
const MIN_GAP_MS = 4500;
let lastCall = 0;
// Ist das Tageslimit erreicht, für den Rest des Laufs nicht weiter versuchen.
let quotaExhausted = false;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function geminiConfigured() {
  return Boolean(apiKey);
}

export async function rewriteNews(article: { title: string; text: string; source: string }) {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Returning original content.");
    return fallbackResponse(article, "API Key missing.");
  }
  if (quotaExhausted) {
    return fallbackResponse(article, "Gemini-Limit für heute erreicht.");
  }

  const prompt = `
Du bist Redakteur bei "CURBSIDE", einem deutschen Skateboard-Magazin von Skatern für Skater.
Schreibe die folgende News in zwei eigenständigen Versionen neu: Deutsch und Englisch.

REGELN:
1. Nur Fakten aus dem Originaltext verwenden. Nichts erfinden (keine Namen, Daten, Zahlen, Zitate).
2. DEUTSCH: lockerer, authentischer Ton mit "du", wie ein Skater, der einem Freund davon erzählt.
   Skate-Begriffe (Spot, Session, Part, Trick-Namen) bleiben englisch, sonst normales gutes Deutsch.
   Nicht wörtlich übersetzen, sondern nacherzählen. Kein übertriebener Slang.
3. ENGLISCH: klarer Skate-Journalismus, informativ und packend.
4. Jeweils ein kurzer, knackiger Titel (ohne "[News]") und 2–4 kurze Absätze.
5. Am Ende des Textes die Quelle nennen: "Quelle: ${article.source}" bzw. "Source: ${article.source}".
6. 2–4 passende Tags (Marken, Fahrer, Event, Thema).

Originaltitel: ${article.title}
Quelle: ${article.source}
Text: ${article.text.substring(0, 4000)}

Antworte nur mit JSON in genau dieser Form:
{"de":{"title":"...","content":"..."},"en":{"title":"...","content":"..."},"tags":["..."]}
`;

  const errors: string[] = [];
  for (const modelName of MODELS) {
    try {
      const wait = lastCall + MIN_GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastCall = Date.now();

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(text);
      if (!data?.de?.title || !data?.de?.content || !data?.en?.title || !data?.en?.content) {
        throw new Error("Unvollständige Antwort");
      }
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${modelName}: ${msg}`);
      // Ungültiger Schlüssel → andere Modelle helfen auch nicht
      if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) break;
      // Tageslimit erreicht → für diesen Lauf aufhören
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg) && /per ?day|daily|PerDay/i.test(msg)) {
        quotaExhausted = true;
        break;
      }
    }
  }

  console.warn(`Gemini fehlgeschlagen für "${article.title}": ${errors.join(" | ")}`);
  return fallbackResponse(article, errors.join(" | "));
}

function fallbackResponse(article: { title: string; text: string; source: string }, error: string) {
  const deTitle = `[News] ${article.title}`;
  const deContent = `${article.text.substring(0, 500)}... (Originalquelle: ${article.source})`;

  return {
    de: { title: deTitle, content: deContent },
    en: { title: article.title, content: article.text.substring(0, 500) + "..." },
    tags: ["news", article.source.toLowerCase()],
    error
  };
}
