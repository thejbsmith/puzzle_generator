@AGENTS.md

## Parallelization
This project runs inside cmux. For any task with independent workstreams, use cmux
to split panes and run parallel Claude Code agents rather than working sequentially.
Use the /cmux skill for orchestration patterns.

## Project
Puzzle generator (word search + Sudoku) — live at https://puzzle-generator-nine.vercel.app.
Stack: Next.js 16.2.6 App Router · Supabase · Google OAuth · Groq · Vercel.
See README.md for full context and project structure.

## Deployment
`vercel --prod` from the project root. Git push does NOT trigger auto-deploy despite
the project being git-linked to Vercel.

## Planned features
See README.md for the full roadmap. Summary of what's coming and relevant existing hooks:

- **Crossword** — puzzle type card already on home page; most complex, needs its own generation engine.
- **Cross-device progress sync** — `solve_progress jsonb` column in `user_puzzle_saves` is reserved for this; currently unused.

Already shipped (hooks documented for reference):
- **Custom word list** — fully live. `WordSource` toggle in `src/app/page.tsx`; custom mode bypasses `generateWords`, passes words directly to `generateWordSearch`. `WordChipInput` component; space/comma/Enter all trigger word commit.
- **Sudoku** — fully live. Generator at `src/lib/puzzle/sudoku.ts`; grid component at `src/components/puzzle/SudokuGrid.tsx`; solve route at `/sudoku/[share_slug]`; `sudoku_puzzles` table in Supabase (see `scratchpad/sudoku_schema.sql`).
- **Puzzle naming / library rename** — users can name a puzzle at save time (shown to signed-in users only in generator result card). `RenameEntryButton` component provides inline rename on library cards. `nickname` column on `user_puzzle_saves`.
- **Library grouped by puzzle type** — `user_puzzle_saves` has `puzzle_type TEXT` + nullable FKs (`puzzle_id`, `sudoku_puzzle_id`) with check constraint. Library page uses a `sections` array — add one entry per new puzzle type. See `scratchpad/library_extensibility_schema.sql`.
- **User avatars** — Google OAuth profile photo via `user_metadata.avatar_url`; DiceBear identicon fallback (`api.dicebear.com/9.x/identicon/svg`). Uses `AvatarImage` (not `next/image`) inside shadcn `Avatar` so `AvatarFallback` is properly suppressed on load.
- **Share links with Open Graph meta** — `ShareButton` component uses Web Share API with clipboard fallback. Both solve pages export `generateMetadata()` for dynamic `og:title` / `og:description`. Root layout has `metadataBase` set to the Vercel URL.

## Non-obvious gotchas

### Supabase client choice
- Server Components and Server Actions → `createClient()` from `@/lib/supabase/server`
- Client Components → `createClient()` from `@/lib/supabase/client`
- Direct DB (psql) is IPv6-only. Use Supabase CLI or the Management API for schema work.
  The personal access token lives in `.env.local` as `SUPABASE_ACCESS_TOKEN`.

### Running SQL migrations (schema changes)
`supabase` is not installed globally — always use `npx supabase`. The project ref is
`johrmzaetkchoficsqkh`. Do this in order every time:

```bash
# 1. Link the project (required before --linked works; safe to re-run)
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  npx supabase link --project-ref johrmzaetkchoficsqkh --password $SUPABASE_DB_PASSWORD

# 2. Execute a SQL file
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  npx supabase db query --linked -f scratchpad/your_migration.sql

# 3. Or execute an inline query
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN \
  npx supabase db query --linked "select count(*) from your_table;"
```

Key pitfalls that cost time:
- `--project-ref` does NOT exist on `db query` — use `link` first, then `--linked`
- The env var must be `SUPABASE_ACCESS_TOKEN`, not passed as a flag
- `supabase db query` is available from CLI v2.79.0+ (`npx supabase --version` to confirm)
- Save migration SQL to `scratchpad/` and verify with a follow-up SELECT after running

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
