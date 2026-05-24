You are building the core UI for the puzzle_generator Next.js app at /Users/thejbsmith/workspace/thejbsmith/puzzle_generator.

The app uses shadcn/ui components (already installed: button, card, select, badge, separator, avatar, label, input, dialog) and Tailwind CSS.

Create these files:

FILE 1: src/components/layout/Navbar.tsx
A client component ('use client') that shows:
- Left: App title "Puzzle Generator" as an h1/link to "/"
- Right: Auth state (use Supabase browser client)
  - Not logged in: "Sign in with Google" button that calls supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })
  - Logged in: show Avatar with user initials (from email) + "Sign out" button that calls supabase.auth.signOut()
- Use useEffect to get the current session on mount and subscribe to auth state changes
- Use shadcn Avatar component for the user avatar showing first letter of email
- Use createClient from '@/lib/supabase/client'
- Clean, minimal navbar with border-b

FILE 2: src/app/layout.tsx  
Update the existing layout to:
- Import and render Navbar above {children}
- Set metadata: title 'Puzzle Generator', description 'Create beautiful word search puzzles'
- Keep the existing font setup (Geist fonts)
- Wrap children in a main tag with container/padding

FILE 3: src/app/page.tsx
A client component ('use client') that is the home page:

State:
- selectedType: 'word-search' | null (default: 'word-search')
- theme: string (default: '')
- gridSize: '10' | '15' | '20' (default: '15')
- difficulty: 'easy' | 'medium' | 'hard' (default: 'medium')
- wordSource: 'ai' | 'custom' (default: 'ai')
- isGenerating: boolean
- generationResult: { words: string[]; grid: string[][]; theme: string } | null
- error: string | null

Layout:
1. Hero: "Create Beautiful Puzzles" as a large heading, subtitle "Powered by AI"

2. Puzzle type selector: 3 cards in a row
   - Word Search: clickable, shows as selected/active with ring/border highlight
   - Sudoku: grayed out with a "Coming Soon" Badge, cursor-not-allowed
   - Crossword: grayed out with a "Coming Soon" Badge, cursor-not-allowed

3. When selectedType === 'word-search', show config form below the selector:
   - Theme input (shadcn Input): label "Theme", placeholder "e.g. Ocean Animals, Space Exploration"
   - Grid Size (shadcn Select): label "Grid Size", options: "10x10", "15x15", "20x20" 
   - Difficulty (shadcn Select): label "Difficulty", options: Easy/Medium/Hard
   - Word Source: two cards side by side
     - "AI Generated" card: active/selectable
     - "Custom Word List" card: disabled appearance, "Coming Soon" Badge overlay
   - "Generate Puzzle" button: full width, primary, disabled when isGenerating
     - Shows "Generating..." with a spinner when isGenerating

4. Generation result display (when generationResult is not null):
   - Show: "Puzzle Generated!" heading
   - Show: "Found {words.length} words for '{theme}'" 
   - Show word list as badges
   - Show a placeholder grid (just a gray box with dimensions text) where the interactive grid will be
   - Show: "Save Puzzle" button (disabled for now, with tooltip "Coming in Phase 3")

On form submit:
- Set isGenerating = true
- Import and call generateWords from '@/app/actions/generateWords' with { theme, difficulty: difficulty, count: 20 }
- If error, set error state
- If success, import and call generateWordSearch from '@/lib/puzzle/wordSearch' with { gridSize: parseInt(gridSize), difficulty, words: result.words }
- Set generationResult = { words: result.words, grid: puzzleResult.grid, theme }
- Set isGenerating = false

FILE 4: src/app/library/page.tsx
A server component that:
- Gets the current user via Supabase server client (createClient from '@/lib/supabase/server')
- If not logged in: shows "Sign in to view your saved puzzles" with a sign-in prompt
- If logged in: queries user_puzzle_saves joined with puzzles for this user, shows a grid of puzzle cards
  - Each card shows: theme, size, difficulty, created_at date
  - For now show a placeholder "No saved puzzles yet" if no results

FILE 5: src/app/auth/error/page.tsx
Simple error page: "Authentication failed. Please try again." with a link back to home.

Ensure all imports are correct and TypeScript is strict. Use Tailwind for styling with good spacing, iPad-friendly large tap targets (min 44px height for interactive elements).

When done, save a summary to scratchpad/agent-d-done.md describing what files you created.
