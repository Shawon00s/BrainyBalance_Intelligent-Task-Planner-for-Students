// backend/services/geminiService.js
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Calls Gemini API with a prompt and returns the response text.
 * @param {string} prompt - The prompt/question for Gemini.
 * @returns {Promise<string>} - The AI-generated response.
 */
export async function getGeminiRecommendation(prompt) {
    if (!GEMINI_API_KEY) throw new Error('Gemini API key not set');
    const body = {
        contents: [{ parts: [{ text: prompt }] }]
    };
    const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Gemini API error');
    const data = await res.json();
    // Extract the generated text
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
