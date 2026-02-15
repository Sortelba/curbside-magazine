import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = (process.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);

export async function rewriteNews(article: { title: string; text: string; source: string }) {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Returning original content.");
    return fallbackResponse(article, "API Key missing.");
  }

  const prompt = `
    You are a passionate skateboarder and senior editor for "CURBSIDE".
    Rewrite the following article content into engaging blog posts in both **GERMAN** and **ENGLISH**.
    
    GERMAN must be authentic "skater speak" ( casual, informal, use Du).
    ENGLISH must be professional blog style.

    Original Title: ${article.title}
    Source: ${article.source}
    Content: ${article.text.substring(0, 2500)}

    Output valid JSON:
    {
      "de": { "title": "German Title", "content": "German content" },
      "en": { "title": "English Title", "content": "English content" },
      "tags": ["news"]
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
  const deContent = `${article.text.substring(0, 500)}... \n\n(Note: Automatische Übersetzung fehlgeschlagen. Originalquelle: ${article.source})`;

  return {
    de: { title: deTitle, content: deContent },
    en: { title: article.title, content: article.text.substring(0, 500) + "..." },
    tags: ["news", article.source.toLowerCase()],
    error
  };
}
