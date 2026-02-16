import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

export async function rewriteNews(article: { title: string; text: string; source: string }) {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Returning original content.");
    return fallbackResponse(article, "API Key missing.");
  }

  const prompt = `
    You are a passionate skateboarder and senior editor for "CURBSIDE", the most authentic German skate platform.
    Your task is to rewrite news content from a given source into two distinct blog versions: a German one for our core audience and an English one for the global community.

    CRITICAL INSTRUCTIONS:
    1. **GERMAN VERSION**: 
       - Must be authentic "skater speak". Use terms like "Sick", "Gnarly", "Spot", "Session", "Pushen".
       - Use "Du" (informal). 
       - Tone: energetic, community-focused, "from skaters for skaters".
       - DO NOT translate literally. Retell the story in a way a local skater would tell it to a friend.

    2. **ENGLISH VERSION**:
       - Professional skate journalism style (think Thrasher or Jenkem).
       - Engaging, clear, and informative.
       - Global appeal.

    3. **OUTPUT**:
       - You MUST return a valid JSON object.
       - BOTH "de" and "en" fields must be fully populated with unique content in their respective languages.
       - If the source is in English, translate it to German first, then refine the English version.
       - Title should be catchy and uppercase/italic where appropriate (handled by UI, but keep it punchy).

    Original Title: ${article.title}
    Source: ${article.source}
    Content: ${article.text.substring(0, 3000)}

    JSON Structure:
    {
      "de": { "title": "Deutscher Titel", "content": "Deutscher Text im Skater-Slang..." },
      "en": { "title": "English Title", "content": "English professional skate blog text..." },
      "tags": ["news", "kultur"]
    }
  `;

  // Try different configurations
  const configs = [
    { model: "gemini-1.5-flash", version: "v1beta" },
    { model: "gemini-1.5-flash", version: "v1" },
    { model: "gemini-pro", version: "v1beta" }
  ];

  let errors = [];

  for (const config of configs) {
    try {
      const model = genAI.getGenerativeModel({ model: config.model }, { apiVersion: config.version });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (e) {
      errors.push(`${config.model} (${config.version}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // All failed - return "Manual" bilingual response as a last resort
  return fallbackResponse(article, errors.join(" | "));
}

function fallbackResponse(article: { title: string; text: string; source: string }, error: string) {
  // Very basic "Skater" adaptation for German if Gemini fails
  const deTitle = `[News] ${article.title}`;
  const deContent = `${article.text.substring(0, 500)}... (Originalquelle: ${article.source})`;

  return {
    de: { title: deTitle, content: deContent },
    en: { title: article.title, content: article.text.substring(0, 500) + "..." },
    tags: ["news", article.source.toLowerCase()],
    error
  };
}
