# Puzzle Generator

AI-powered word search puzzles. Generate themed puzzles, share them via link, and solve them in the browser.

**Live:** https://puzzle-generator-nine.vercel.app

## Features

- AI-generated word lists via Groq (`llama-3.3-70b-versatile`)
- Interactive word search grid — drag to select, color-coded SVG pill highlights
- Fill/outline toggle for found-word highlights
- Shareable puzzles via unique link (no account required to play or generate)
- Personal library — save and manage puzzles with Google sign-in
- Print-friendly layout (fits on one letter-size page)
- Progress saved per-browser in localStorage; each player has independent progress

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.6 (App Router) |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth + Google OAuth |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Deployment | Vercel |
| UI | Tailwind CSS v4 + shadcn/ui |

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project with Google OAuth enabled
- A Groq API key

### Environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_DB_PASSWORD=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GROQ_API_KEY=...
SUPABASE_ACCESS_TOKEN=...   # Supabase personal access token (for Management API)
```

### Database setup

Run `scratchpad/schema.sql` against your Supabase project to create the tables and RLS policies.

### Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project Structure

```
src/
  app/
    actions/          # Server actions
      generateWords   # Groq word list generation
      savePuzzle      # Create puzzle in DB + return share slug
      saveToLibrary   # Add puzzle to user's saved library
      removeFromLibrary
    auth/callback     # OAuth callback route
    library/          # User's saved puzzles (auth-gated)
    puzzle/[share_slug]/  # Individual puzzle page
    page.tsx          # Home: puzzle generator form
  components/
    layout/Navbar     # Auth state, sign-in/out, library link
    puzzle/
      WordSearchGrid  # Interactive grid + SVG highlights + progress persistence
      SaveToLibraryButton
      RemoveFromLibraryButton
  lib/
    puzzle/           # Word search engine (pure JS, no deps)
    supabase/         # client / server / middleware helpers
```

## Database Schema

Two tables:

**`puzzles`** — every generated puzzle (anonymous or authenticated)
- `share_slug` — 8-char UUID prefix, used in URLs
- `grid` — 2D letter array (jsonb)
- `words` — word list (jsonb)
- `theme`, `difficulty`, `size`, `created_by`

**`user_puzzle_saves`** — explicit saves to a user's library
- `user_id`, `puzzle_id`, `saved_at`
- `solve_progress jsonb` — reserved for future cross-device progress sync (currently unused; progress is in localStorage)

RLS: puzzles are publicly readable; anyone can create a puzzle (anonymous or authenticated); users can only read/modify their own saves.

## Roadmap

Features already advertised in the UI as "Coming Soon":

### Custom word list (word search)
Let users supply their own word list instead of relying on AI generation. The UI placeholder and `WordSource` type (`'ai' | 'custom'`) are already in `src/app/page.tsx` — wiring up the input and bypassing the Groq call is the main work.

### Sudoku
Generate and solve Sudoku puzzles in the browser. The puzzle type selector card is already present on the home page. Needs: a Sudoku generator, an interactive solving grid, and a new puzzle type in the DB schema (`type` column or separate table).

### Crossword
AI-assisted crossword generation — place themed words with intersections, generate clues via Groq. Significantly more complex than word search; likely needs a separate generation engine and a different interactive grid component.

### Cross-device progress sync (word search)
The `solve_progress jsonb` column in `user_puzzle_saves` is reserved for this. Currently, progress lives only in `localStorage`. For signed-in users, progress could be read from and written to the DB so it follows them across devices.

## Deployment

```bash
vercel --prod
```

Git push does not auto-deploy. Run `vercel --prod` explicitly after pushing.
