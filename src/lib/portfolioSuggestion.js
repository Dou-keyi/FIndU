// portfolioSuggestion.js — generates AI portfolio suggestions from social posts via Gemini API

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generate a portfolio item suggestion based on a candidate's post content
 * @param {string} postContent — the text of the post
 * @param {Array} existingPortfolioItems — current portfolio items
 * @returns {{ suggest: boolean, item_type?: string, title?: string, description?: string, tags?: string[] }}
 */
export async function generatePortfolioSuggestion(postContent, existingPortfolioItems = []) {
  if (!GEMINI_API_KEY) {
    console.info('No VITE_GEMINI_API_KEY — skipping portfolio suggestion');
    return { suggest: false };
  }

  const prompt = `A candidate just posted this update on a career platform:
"${postContent}"

Their current portfolio has these items:
${existingPortfolioItems.map((i) => `- ${i.item_type}: ${i.title}`).join('\n') || 'None yet'}

Based on the post, suggest ONE new portfolio item they should add.
Only suggest if the post describes a concrete achievement, project, or skill demonstration.
If the post is too generic (e.g. "great day today"), respond with { "suggest": false }.

Respond ONLY with JSON in this exact shape — no markdown, no preamble:
{
  "suggest": true,
  "item_type": "project" | "achievement" | "experience" | "certification",
  "title": "short title under 8 words",
  "description": "one sentence, 15–25 words, specific and factual",
  "tags": ["tag1", "tag2"]
}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini portfolio suggestion API returned status:', response.status);
      return { suggest: false };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('Gemini returned empty text for portfolio suggestion');
      return { suggest: false };
    }

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.warn('Portfolio suggestion failed:', err.message);
    return { suggest: false };
  }
}
