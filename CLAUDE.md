@AGENTS.md

## Parallelization
This project runs inside cmux. For any task with independent workstreams, use cmux
to split panes and run parallel Claude Code agents rather than working sequentially.
Use the /cmux skill for orchestration patterns.

## Project
Word search puzzle generator — live at https://puzzle-generator-nine.vercel.app.
Stack: Next.js 16.2.6 App Router · Supabase · Google OAuth · Groq · Vercel.
See README.md for full context and project structure.

## Deployment
`vercel --prod` from the project root. Git push does NOT trigger auto-deploy despite
the project being git-linked to Vercel.

## Planned features
See README.md for the full roadmap. Summary of what's coming and relevant existing hooks:

- **Custom word list** — `WordSource` type and UI placeholder already exist in `src/app/page.tsx`; `wordSource` state is wired but only `'ai'` is active. Note: the state setter is intentionally omitted (`const [wordSource] = useState<WordSource>('ai')`) — add the setter when implementing this. Bypasses `generateWords` action.
- **Sudoku** — puzzle type card already on home page; needs generator, grid component, and schema addition.
- **Crossword** — puzzle type card already on home page; most complex, needs its own generation engine.
- **Cross-device progress sync** — `solve_progress jsonb` column in `user_puzzle_saves` is reserved for this; currently unused.

## Non-obvious gotchas

### Supabase client choice
- Server Components and Server Actions → `createClient()` from `@/lib/supabase/server`
- Client Components → `createClient()` from `@/lib/supabase/client`
- Direct DB (psql) is IPv6-only. Use Supabase CLI or the Management API for schema work.
  The personal access token lives in `.env.local` as `SUPABASE_ACCESS_TOKEN`.

### Supabase key naming
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` are the correct modern
Supabase key names. Supabase now treats `anon` / `service_role` as legacy. Do not rename
these to the old convention — the Supabase dashboard and newer SDK docs use publishable/secret.

### RLS: anonymous puzzle creation
The puzzles INSERT policy must allow NULL `created_by` for anonymous users:
```sql
with check (created_by is null or auth.uid() = created_by)
```
The naive `auth.uid() = created_by` silently fails when both sides are NULL.

### Puzzle progress is localStorage-only
Solve progress is stored as `puzzle-${shareSlug}` in each browser's localStorage.
It is NOT written to the database. The `solve_progress jsonb` column in
`user_puzzle_saves` exists for future cross-device sync but is currently unused.
Each browser/player has fully independent progress — this is intentional.

### SVG pill highlights use `<rect>`, not `<line>`
A `<line>`'s stroke IS its visual fill — you can't toggle fill independently from outline.
The highlights are `<rect rx ry>` elements with `transform="translate(cx,cy) rotate(angle)"`.
Separate `fill` and `stroke` attributes let the toggle hide the fill while keeping the outline visible.

### Color assignment: selection must match found-word circle
Word colors are assigned at the moment of discovery:
`CIRCLE_COLORS[foundWords.size % 10]` evaluated BEFORE adding the word to the set.
The active selection preview uses that same index so the outline color transitions
seamlessly into the filled circle when a word is confirmed.

### Word generation: filter whitespace before uppercasing
The Groq model sometimes returns multi-word phrases (e.g. "Time Lord").
`.replace(/[^A-Z]/g, '')` would silently concatenate them into "TIMELORD".
The post-processing pipeline must `.filter((w) => !/\s/.test(w))` BEFORE the map/replace step.

### Google OAuth must be explicitly enabled in Supabase
It is off by default. Enable via the Management API:
```bash
curl -X PATCH https://api.supabase.com/v1/projects/{ref}/config/auth \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"external_google_enabled": true, "external_google_client_id": "...", "external_google_secret": "..."}'
```
Also ensure `https://{ref}.supabase.co/auth/v1/callback` is an authorized redirect URI
in the Google Cloud Console OAuth client.
