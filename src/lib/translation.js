// translation.js — Free translation utility using Google Translate's public endpoint
// Note: For a production app, you should use a paid API like DeepL or Google Cloud Translation,
// or a dedicated proxy/Edge Function to protect your keys and prevent rate limiting.

/**
 * Translates text and auto-detects the source language.
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code (e.g., 'en', 'es', 'fr')
 * @returns {Promise<{ original: string, translated: string, detectedLang: string }>}
 */
export async function translateText(text, targetLang = 'en') {
  if (!text || !text.trim()) {
    return { original: text, translated: text, detectedLang: 'unknown' };
  }

  try {
    // client=gtx is a known public endpoint used by browser extensions
    // sl=auto (source language: auto-detect)
    // tl=targetLang (target language)
    // dt=t (return translation)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    
    // The response is a nested array. 
    // data[0] is an array of translated segments: [["Translated sentence 1.", "Original sentence 1."], ...]
    // data[2] is the detected source language code (e.g., "es", "fr")
    
    const translatedText = data[0].map(segment => segment[0]).join('');
    const detectedLang = data[2] || 'unknown';

    return {
      original: text,
      translated: translatedText,
      detectedLang
    };
  } catch (error) {
    console.error('Translation failed:', error);
    throw error;
  }
}
