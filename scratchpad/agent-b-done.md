# Agent B — Done

## Files Created

### `src/app/actions/generateWords.ts`
- Next.js Server Action (`'use server'` at file top)
- Uses `@google/genai` v2 SDK: `new GoogleGenAI({ apiKey })` → `ai.models.generateContent({ model, contents })`
- `response.text` is a getter on `GenerateContentResponse` (confirmed from SDK types)
- Builds a prompt requesting a raw JSON array of uppercase strings
- Two-pass JSON parse: raw text first, then strips markdown backticks on failure
- Validates result is `string[]`, uppercases all words
- Returns `{ words }` on success, `{ words: [], error }` on any failure

### `src/app/actions/savePuzzle.ts`
- Next.js Server Action (`'use server'` at file top)
- Imports `createClient` from `@/lib/supabase/server` (created by another agent)
- `share_slug` = first 8 chars of `crypto.randomUUID()` (native Node.js 14.17+)
- Calls `supabase.auth.getUser()` to get the current user (nullable — unauthenticated saves allowed)
- Inserts into `puzzles` table: `theme, size, difficulty, grid, words, share_slug, created_by`
- Returns `{ share_slug }` on success, `{ error }` on Supabase insert failure

## Notes
- Verified `GoogleGenAI` constructor and `ai.models.generateContent` signature against `node_modules/@google/genai/dist/genai.d.ts`
- `ContentListUnion = Content | Content[] | PartUnion | PartUnion[]` and `PartUnion = Part | string`, so passing a plain string for `contents` is correct
- Followed AGENTS.md: read Next.js 16 server actions docs before writing code
