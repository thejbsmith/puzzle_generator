You are building the Gemini API integration and puzzle save action for the puzzle_generator Next.js app at /Users/thejbsmith/workspace/thejbsmith/puzzle_generator.

Create two files:

FILE 1: src/app/actions/generateWords.ts
This is a Next.js Server Action (use 'use server' directive).

Import: import { GoogleGenAI } from '@google/genai';

The action signature:
export async function generateWords(params: {
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}): Promise<{ words: string[]; error?: string }>

Logic:
- Create: const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
- Build a prompt that instructs Gemini to return ONLY a JSON array of strings (no markdown, no backticks, no explanation).
  Example prompt: "Generate exactly {count} words suitable for a word search puzzle with the theme '{theme}'. Difficulty level is {difficulty}. Guidelines: easy=short common words 4-6 letters, kid-friendly; medium=5-8 letters, moderate vocabulary; hard=7-12 letters, challenging vocabulary. Return ONLY a valid JSON array of uppercase strings, nothing else. Example: ["OCEAN","WAVE","SHARK"]"
- Call: const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
- Get text: const text = response.text ?? '';
- Try to parse JSON. If parsing fails, strip any markdown backticks and try once more.
- Validate the result is an array of strings. Filter to only string items. Uppercase all words.
- On any error, return { words: [], error: errorMessage }
- On success, return { words: parsedArray }

FILE 2: src/app/actions/savePuzzle.ts
This is a Next.js Server Action (use 'use server' directive).

Import createClient from @/lib/supabase/server (this will be created by another agent — assume it exists and exports: async function createClient())

The action signature:
export async function savePuzzle(params: {
  theme: string;
  size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: string[][];
  words: string[];
}): Promise<{ share_slug?: string; error?: string }>

Logic:
- Generate share_slug: first 8 characters of a random UUID. Use crypto.randomUUID() — this is available in Node.js 14.17+.
- Create supabase client: const supabase = await createClient();
- Get user: const { data: { user } } = await supabase.auth.getUser();
- Insert into puzzles table with all params plus share_slug and created_by: user?.id ?? null
- If insert error, return { error: error.message }
- On success, return { share_slug }

When done, save a summary to scratchpad/agent-b-done.md describing what you built.
