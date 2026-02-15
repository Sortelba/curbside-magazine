import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function rewriteNews(article: { title: string; text: string; source: string }) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found. Returning original content.");
    return {
      title: article.title,
      content: article.text.substring(0, 200) + "...",
      tags: ["news", article.source.toLowerCase().replace(/\s/g, '')]
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are a passionate skateboarder running the "CURBSIDE" news site.
    Rewrite the following article content into engaging blog posts in both **GERMAN** and **ENGLISH**.
    
    Guidelines for German:
    1.  **Style**: Casual, authentic, passionate ("skater speak"). Use terms like "Sick", "Gnarly", "Video Part", "Trick" naturally.
    2.  **Detail**: Keep ALL key facts, names of skaters, trick names, and locations.
    3.  **Structure**: Hook, details, hype statement.

    Guidelines for English:
    1.  **Style**: High-quality, engaging blog post style. Authentic and exciting, but polished.
    2.  **Detail**: Matching the German version in depth.
    3.  **Structure**: Hook, details, hype statement.

    Original Title: ${article.title}
    Source: ${article.source}
    Original Text: ${article.text.substring(0, 3000)}

    Output valid JSON:
    {
      "de": {
        "title": "Catchy German title",
        "content": "Full German content"
      },
      "en": {
        "title": "Catchy English title",
        "content": "Full English content"
      },
      "tags": ["tag1", "tag2", "tag3", "skatername"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error rewriting with Gemini:", error);
    return {
      title: article.title,
      content: `Check out the latest from ${article.source}.`,
      tags: ["news"]
    };
  }
}
