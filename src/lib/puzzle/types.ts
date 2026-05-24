export type GridSize = 10 | 15 | 20;

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Direction =
  | 'right'
  | 'left'
  | 'down'
  | 'up'
  | 'down-right'
  | 'down-left'
  | 'up-right'
  | 'up-left';

export interface Cell {
  row: number;
  col: number;
}

export interface WordPlacement {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  cells: Cell[];
}

export interface WordSearchConfig {
  gridSize: GridSize;
  difficulty: Difficulty;
  words: string[];
}

export interface WordSearchResult {
  grid: string[][];
  placements: WordPlacement[];
  placedWords: string[];
  failedWords: string[];
}

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface SudokuPuzzle {
  puzzle: (number | null)[][];
  solution: number[][];
  difficulty: SudokuDifficulty;
}
