'use server';

import Groq from 'groq-sdk';

export async function generateWords(params: {
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}): Promise<{ words: string[]; error?: string }> {
  const { theme, difficulty, count } = params;

  const guidelines: Record<typeof difficulty, string> = {
    easy: 'common everyday words, 4-6 letters long, suitable for children',
    medium: 'common everyday words, 6-9 letters long, suitable for adults',
    hard: 'longer common words, 8-12 letters long — use well-known terms, never scientific names',
  };

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content:
            `Generate exactly ${count} words for a word search puzzle with the theme "${theme}". ` +
            `Difficulty: ${difficulty} (${guidelines[difficulty]}). ` +
            `RULES: Each entry must be a single word with no spaces. ` +
            `Only use complete, real English words from everyday vocabulary. ` +
            `Never use multi-word phrases, scientific names, Latin terms, abbreviations, or partial words. ` +
            `Each word must be spelled in full — do not truncate any word. ` +
            `Return ONLY a valid JSON array of uppercase strings, nothing else. Example: ["OCEAN","WAVE","SHARK"]`,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const stripped = text.replace(/```(?:json)?/g, '').trim();
      parsed = JSON.parse(stripped);
    }

    if (!Array.isArray(parsed)) {
      return { words: [], error: 'Model did not return an array' };
    }

    const words = [...new Set(
      (parsed as unknown[])
        .filter((item): item is string => typeof item === 'string')
        .filter((w) => !/\s/.test(w))
        .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
        .filter((w) => w.length >= 3),
    )];

    return { words };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimit = message.includes('429') || message.toLowerCase().includes('rate');
    return {
      words: [],
      error: isRateLimit
        ? 'Rate limit hit — please wait a moment and try again.'
        : message,
    };
  }
}
