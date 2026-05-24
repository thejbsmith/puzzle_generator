# Agent A — Word Search Engine

## Files created

### src/lib/puzzle/types.ts
Defines all domain types:
- `GridSize` (10 | 15 | 20)
- `Difficulty` ('easy' | 'medium' | 'hard')
- `Direction` (8-way union)
- `Cell`, `WordPlacement`, `WordSearchConfig`, `WordSearchResult`

### src/lib/puzzle/wordSearch.ts
Exports `generateWordSearch(config: WordSearchConfig): WordSearchResult` (named + default).

Key implementation details:
- Direction vectors table keyed by `Direction`
- Per-difficulty allowed-directions map
- `tryPlace` validates bounds and letter conflicts (crossing allowed)
- Up to 100 random placement attempts per word; failures tracked in `failedWords`
- Hard-mode filler: letters from word list repeated 3× + 10 random letters (biased pool)
- Easy/medium filler: uniform random from A–Z
- All words uppercased before processing

TypeScript strict mode passes with `tsc --noEmit` (no errors).
