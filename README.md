# Puzzle Generator

AI-powered puzzle generator. Create, share, and solve word search and Sudoku puzzles in the browser.

**Live:** https://puzzle-generator-nine.vercel.app

## Features

- **Word search** — AI-generated themed word lists via Groq, or supply your own custom word list
- **Sudoku** — generate puzzles at four difficulty levels (easy → expert); interactive solving grid
- Interactive solving — drag-to-select word search, keyboard/tap Sudoku input
- Color-coded SVG pill highlights for found words; fill/outline toggle
- Shareable puzzles via unique link — no account required to play or generate
- Rich link previews — dynamic Open Graph meta tags per puzzle (title, description)
- Personal library — save, name, rename, and manage puzzles with Google sign-in
- Library grouped by puzzle type; each type shows count badge
- User avatars — Google profile photo, or DiceBear identicon fallback
- Print-friendly word search layout (fits one letter-size page)
- Solve progress saved per-browser in localStorage; each player has independent progress

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...  # "publishable" is the modern Supabase key (replaces legacy anon key)
SUPABASE_SECRET_KEY=sb_secret_...                        # replaces legacy service_role key
SUPABASE_DB_PASSWORD=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GROQ_API_KEY=...
SUPABASE_ACCESS_TOKEN=...   # Supabase personal access token (for Management API / CLI)
```

### Database setup

Run the migration files in `scratchpad/` against your Supabase project in order:
1. `schema.sql` — `puzzles` table (word search)
2. `sudoku_schema.sql` — `sudoku_puzzles` table
3. `library_extensibility_schema.sql` — extends `user_puzzle_saves` for multi-type support
4. `nickname_schema.sql` — adds `nickname` column to `user_puzzle_saves`

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
    actions/                  # Server actions
      generateWords           # Groq word list generation
      savePuzzle              # Create word search in DB + return share slug
      saveSudoku              # Create sudoku in DB + return share slug
      saveToLibrary           # Add puzzle to user's library (polymorphic by puzzle_type)
      removeFromLibrary       # Remove from library
      renameLibraryEntry      # Update nickname on a library entry
    auth/callback             # OAuth callback route
    library/                  # User's saved puzzles (auth-gated, grouped by type)
    puzzle/[share_slug]/      # Word search solve page
    sudoku/[share_slug]/      # Sudoku solve page
    page.tsx                  # Home: puzzle type selector + generator form
  components/
    layout/Navbar             # Auth state, sign-in/out, avatar, library link
    puzzle/
      WordSearchGrid          # Interactive grid + SVG highlights + progress persistence
      SudokuGrid              # 9×9 interactive solving grid + conflict detection
      WordChipInput           # Tag/chip input for custom word lists
      SaveToLibraryButton     # Save/unsave toggle (polymorphic)
      RemoveFromLibraryButton # Remove from library card action
      RenameEntryButton       # Inline rename (pencil icon → input)
      ShareButton             # Web Share API with clipboard fallback
  lib/
    puzzle/
      sudoku.ts               # Sudoku generator (backtracking + MRV uniqueness check)
      types.ts                # Shared puzzle types
    supabase/                 # client / server / middleware helpers
```

## Database Schema

**`puzzles`** — every generated word search (anonymous or authenticated)
- `share_slug` — 8-char UUID prefix, used in URLs
- `grid` — 2D letter array (jsonb)
- `words` — word list (jsonb)
- `theme`, `difficulty`, `size`, `created_by`

**`sudoku_puzzles`** — every generated Sudoku
- `share_slug` — 8-char UUID prefix, used in URLs
- `puzzle` — 9×9 grid with nulls for blank cells (jsonb)
- `solution` — completed 9×9 grid (jsonb)
- `difficulty` — `easy | medium | hard | expert`

**`user_puzzle_saves`** — explicit saves to a user's library
- `user_id`, `saved_at`, `nickname`
- `puzzle_type` — `word_search | sudoku` (extensible for future types)
- `puzzle_id` — nullable FK → `puzzles` (set when puzzle_type = 'word_search')
- `sudoku_puzzle_id` — nullable FK → `sudoku_puzzles` (set when puzzle_type = 'sudoku')
- Check constraint: exactly one FK must be non-null
- `solve_progress jsonb` — reserved for future cross-device progress sync (currently unused)

RLS: puzzles are publicly readable; anyone can create a puzzle; users can only read/modify their own saves.

## Roadmap

### Crossword
AI-assisted crossword generation — place themed words with intersections, generate clues via Groq. The puzzle type card is already on the home page. Most complex of the planned types; needs its own generation engine and interactive grid.

### Cross-device progress sync
The `solve_progress jsonb` column in `user_puzzle_saves` is reserved for this. Currently, progress lives only in `localStorage`. For signed-in users, progress could follow them across devices.

## Deployment

```bash
vercel --prod
```

Git push does not auto-deploy. Run `vercel --prod` explicitly.
