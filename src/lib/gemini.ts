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
// Das Tageslimit gilt pro Modell: volle Modelle für den Rest des Laufs überspringen.
const exhaustedModels = new Set<string>();

// Ohne Zeitlimit kann eine einzelne Anfrage minutenlang hängen – dann bricht der
// Auto-Scan ab und nichts wird veröffentlicht. Pro Modell max. 40 s, pro Artikel max. 90 s.
const CALL_TIMEOUT_MS = 40_000;
const ARTICLE_BUDGET_MS = 90_000;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function geminiConfigured() {
  return Boolean(apiKey);
}

export async function rewriteNews(article: { title: string; text: string; source: string }) {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Returning original content.");
    return fallbackResponse(article, "API Key missing.");
  }
  if (MODELS.every(m => exhaustedModels.has(m))) {
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
  const deadline = Date.now() + ARTICLE_BUDGET_MS;
  for (const modelName of MODELS) {
    if (exhaustedModels.has(modelName)) continue;
    const remaining = deadline - Date.now();
    if (remaining < 5000) {
      errors.push("Zeitlimit erreicht");
      break;
    }
    try {
      const wait = lastCall + MIN_GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastCall = Date.now();

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }, { timeout: Math.min(CALL_TIMEOUT_MS, remaining) });
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
      // Tageslimit dieses Modells erreicht → dieses Modell überspringen, nächstes probieren
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg)) {
        exhaustedModels.add(modelName);
      }
    }
  }

  console.warn(`Gemini fehlgeschlagen für "${article.title}": ${errors.join(" | ")}`);
  return fallbackResponse(article, errors.join(" | "));
}

/** Rohfassung ohne Gemini (für Entwürfe, die evtl. nie veröffentlicht werden). */
export function rawNews(article: { title: string; text: string; source: string }) {
  return fallbackResponse(article, "");
}

/** True, wenn das Ergebnis eine echte Umschreibung ist (kein Rohtext-Fallback). */
export function isRewritten(r: any) {
  return Boolean(r && !r.error && r.de?.title && r.de?.content && r.en?.title && r.en?.content);
}

/** Übernimmt eine Gemini-Umschreibung in einen Post. */
export function applyRewrite(post: any, r: any) {
  post.title = r.de.title;
  post.description = String(r.de.content).slice(0, 200) + "...";
  post.translations = { de: r.de, en: r.en };
  if (Array.isArray(r.tags) && r.tags.length) post.tags = r.tags.slice(0, 5);
  return post;
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
