// resumeParser.js — Extract text from PDF and parse into structured portfolio sections via Gemini AI

import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Extract all text content from a PDF file
 * @param {File} file — a PDF File object from file input
 * @returns {Promise<string>} — the extracted text
 */
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n');
}

/**
 * Parse extracted resume text into structured portfolio sections using Gemini AI
 * @param {string} resumeText — raw text from the PDF
 * @returns {Promise<Object>} — parsed resume data
 */
export async function parseResumeWithAI(resumeText) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env.local file.');
  }

  const prompt = `You are a professional resume parser. Analyze the following resume text and extract ALL information into structured JSON.

RESUME TEXT:
"""
${resumeText}
"""

Parse the resume into this exact JSON structure. For each section, create an array of items. Each item should have:
- "title": A concise title (e.g. degree name, company/role, project name)
- "description": Detailed description. For education, include coursework and projects. For experience, include responsibilities and achievements. Use newline characters to separate bullet points.
- "tags": Relevant tags (e.g. dates like "Aug 2020 – Jul 2024", technologies, etc.)

IMPORTANT RULES:
1. Map ALL information from the resume — do not skip anything.
2. If something doesn't fit the standard sections, analyze it and place it in the BEST matching section:
   - Volunteering, internships → "experience"
   - Awards, honors, competitions → "achievement"
   - Courses, training programs → "certification"  
   - Research, publications → "project"
   - Interests, activities → "hobby"
   - References, personal statement → "summary"
3. For the "summary" section, combine any objective/summary/about me text into ONE item.
4. For "language" items, put the proficiency level (e.g. "Fluent", "Native", "Intermediate") in the description.
5. For "hobby" items, just set title — no description needed.
6. Extract skills as a flat array of skill names.
7. Extract profile info (name, headline/job title, phone, location/address) if present.

Respond ONLY with valid JSON in this exact shape — no markdown, no preamble:
{
  "profile": {
    "full_name": "string or null",
    "headline": "string or null",
    "phone": "string or null",
    "location": "string or null"
  },
  "skills": ["skill1", "skill2"],
  "sections": {
    "summary": [{ "title": "...", "description": "...", "tags": [] }],
    "education": [{ "title": "...", "description": "...", "tags": [] }],
    "experience": [{ "title": "...", "description": "...", "tags": [] }],
    "project": [{ "title": "...", "description": "...", "tags": [] }],
    "achievement": [{ "title": "...", "description": "...", "tags": [] }],
    "certification": [{ "title": "...", "description": "...", "tags": [] }],
    "language": [{ "title": "...", "description": "...", "tags": [] }],
    "hobby": [{ "title": "...", "description": null, "tags": [] }]
  }
}`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
