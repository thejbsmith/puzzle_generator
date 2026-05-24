You are building the word search puzzle generation engine for the puzzle_generator Next.js app at /Users/thejbsmith/workspace/thejbsmith/puzzle_generator.

Create two files:

FILE 1: src/lib/puzzle/types.ts
Define all TypeScript types for the puzzle domain:
- GridSize: 10 | 15 | 20
- Difficulty: 'easy' | 'medium' | 'hard'
- Direction: all 8 direction names as a union type (e.g. 'right' | 'left' | 'down' | 'up' | 'down-right' | 'down-left' | 'up-right' | 'up-left')
- Cell: { row: number; col: number }
- WordPlacement: { word: string; startRow: number; startCol: number; direction: Direction; cells: Cell[] }
- WordSearchConfig: { gridSize: GridSize; difficulty: Difficulty; words: string[] }
- WordSearchResult: { grid: string[][]; placements: WordPlacement[]; placedWords: string[]; failedWords: string[] }

FILE 2: src/lib/puzzle/wordSearch.ts
Export a function: generateWordSearch(config: WordSearchConfig): WordSearchResult

Logic requirements:
- Initialize an empty grid of config.gridSize x config.gridSize cells
- Available directions by difficulty:
  - easy: ['right', 'down'] only
  - medium: ['right', 'down', 'down-right', 'down-left'] (no backwards)
  - hard: all 8 directions ['right', 'left', 'down', 'up', 'down-right', 'down-left', 'up-right', 'up-left']
- For each word: try up to 100 random placements before giving up. A valid placement means:
  - The word fits within grid bounds
  - Each cell is either empty or already has the correct letter (allows crossing)
- Direction vectors (row delta, col delta):
  - right: [0, 1], left: [0, -1], down: [1, 0], up: [-1, 0]
  - down-right: [1, 1], down-left: [1, -1], up-right: [-1, 1], up-left: [-1, -1]
- After placing all words, fill remaining empty cells:
  - easy/medium: random uppercase letters from 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  - hard: letters biased toward letters that appear in the word list (repeat each letter 3x, then add 10 random letters to the pool) — this makes the filler more misleading
- All words should be converted to uppercase before processing
- Track which words were successfully placed (placedWords) vs failed (failedWords)
- Return the typed WordSearchResult

Use strict TypeScript. No external libraries. Export generateWordSearch as the default and named export.

When done, save a summary to scratchpad/agent-a-done.md describing what you built.
