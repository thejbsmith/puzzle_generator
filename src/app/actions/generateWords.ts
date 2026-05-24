'use server';

import { GoogleGenAI } from '@google/genai';

export async function generateWords(params: {
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}): Promise<{ words: string[]; error?: string }> {
  const { theme, difficulty, count } = params;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt =
      `Generate exactly ${count} words suitable for a word search puzzle with the theme '${theme}'. ` +
      `Difficulty level is ${difficulty}. ` +
      `Guidelines: easy=short common words 4-6 letters, kid-friendly; medium=5-8 letters, moderate vocabulary; hard=7-12 letters, challenging vocabulary. ` +
      `Return ONLY a valid JSON array of uppercase strings, nothing else. Example: ["OCEAN","WAVE","SHARK"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text ?? '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const stripped = text.replace(/```(?:json)?/g, '').trim();
      parsed = JSON.parse(stripped);
    }

    if (!Array.isArray(parsed)) {
      return { words: [], error: 'Gemini did not return an array' };
    }

    const words = (parsed as unknown[])
      .filter((item): item is string => typeof item === 'string')
      .map((w) => w.toUpperCase());

    return { words };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { words: [], error: message };
  }
}
