import type { SudokuDifficulty, SudokuPuzzle } from './types';

const GIVENS: Record<SudokuDifficulty, number> = {
  easy: 40,
  medium: 32,
  hard: 26,
  expert: 22,
};

// Shuffle an array in-place using Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function boxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

// Build constraint sets from a flat grid (0 = empty)
function buildConstraints(grid: number[]): {
  rows: Set<number>[];
  cols: Set<number>[];
  boxes: Set<number>[];
} {
  const rows: Set<number>[] = Array.from({ length: 9 }, () => new Set());
  const cols: Set<number>[] = Array.from({ length: 9 }, () => new Set());
  const boxes: Set<number>[] = Array.from({ length: 9 }, () => new Set());

  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v !== 0) {
      const r = Math.floor(i / 9);
      const c = i % 9;
      rows[r].add(v);
      cols[c].add(v);
      boxes[boxIndex(r, c)].add(v);
    }
  }
  return { rows, cols, boxes };
}

// Fill a complete valid Sudoku grid using backtracking with random candidate order
function fillGrid(grid: number[]): boolean {
  const empty = grid.indexOf(0);
  if (empty === -1) return true;

  const r = Math.floor(empty / 9);
  const c = empty % 9;
  const bi = boxIndex(r, c);

  const { rows, cols, boxes } = buildConstraints(grid);
  const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).filter(
    (n) => !rows[r].has(n) && !cols[c].has(n) && !boxes[bi].has(n),
  );

  for (const n of candidates) {
    grid[empty] = n;
    if (fillGrid(grid)) return true;
    grid[empty] = 0;
  }

  return false;
}

// Efficient constraint-propagation backtracking solver.
// Returns the number of solutions found, stopping once `limit` is reached.
function countSolutions(grid: number[], limit: number): number {
  // Find the empty cell with the fewest candidates (MRV heuristic)
  const { rows, cols, boxes } = buildConstraints(grid);

  let bestIdx = -1;
  let bestCount = 10;

  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const r = Math.floor(i / 9);
    const c = i % 9;
    const bi = boxIndex(r, c);
    let count = 0;
    for (let n = 1; n <= 9; n++) {
      if (!rows[r].has(n) && !cols[c].has(n) && !boxes[bi].has(n)) count++;
    }
    if (count === 0) return 0; // dead end
    if (count < bestCount) {
      bestCount = count;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) return 1; // all filled → one solution found

  const r = Math.floor(bestIdx / 9);
  const c = bestIdx % 9;
  const bi = boxIndex(r, c);

  let total = 0;
  for (let n = 1; n <= 9; n++) {
    if (rows[r].has(n) || cols[c].has(n) || boxes[bi].has(n)) continue;
    grid[bestIdx] = n;
    total += countSolutions(grid, limit - total);
    grid[bestIdx] = 0;
    if (total >= limit) break;
  }
  return total;
}

function hasUniqueSolution(puzzle: number[]): boolean {
  return countSolutions([...puzzle], 2) === 1;
}

export function generateSudokuPuzzle(params: { difficulty: SudokuDifficulty }): SudokuPuzzle {
  const { difficulty } = params;
  const targetGivens = GIVENS[difficulty];

  // Generate a complete valid solution
  const solution = new Array<number>(81).fill(0);
  fillGrid(solution);

  // Remove cells until we reach targetGivens
  const puzzle = [...solution];
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let givens = 81;

  for (const pos of positions) {
    if (givens <= targetGivens) break;
    const saved = puzzle[pos];
    puzzle[pos] = 0;

    if (hasUniqueSolution(puzzle)) {
      givens--;
    } else {
      puzzle[pos] = saved;
    }
  }

  // Convert to 2D arrays
  const puzzle2d: (number | null)[][] = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const v = puzzle[r * 9 + c];
      return v === 0 ? null : v;
    }),
  );

  const solution2d: number[][] = Array.from({ length: 9 }, (_, r) =>
    solution.slice(r * 9, r * 9 + 9),
  );

  return { puzzle: puzzle2d, solution: solution2d, difficulty };
}
