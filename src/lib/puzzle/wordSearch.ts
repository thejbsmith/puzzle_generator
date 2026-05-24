import type {
  Cell,
  Direction,
  Difficulty,
  WordPlacement,
  WordSearchConfig,
  WordSearchResult,
} from './types';

const DIRECTION_VECTORS: Record<Direction, [number, number]> = {
  right:      [0,  1],
  left:       [0, -1],
  down:       [1,  0],
  up:         [-1, 0],
  'down-right': [1,  1],
  'down-left':  [1, -1],
  'up-right':   [-1, 1],
  'up-left':    [-1, -1],
};

const DIRECTIONS_BY_DIFFICULTY: Record<Difficulty, Direction[]> = {
  easy:   ['right', 'down'],
  medium: ['right', 'down', 'down-right', 'down-left'],
  hard:   ['right', 'left', 'down', 'up', 'down-right', 'down-left', 'up-right', 'up-left'],
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function tryPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  direction: Direction,
  size: number,
): Cell[] | null {
  const [dr, dc] = DIRECTION_VECTORS[direction];
  const cells: Cell[] = [];

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    if (grid[r][c] !== '' && grid[r][c] !== word[i]) return null;
    cells.push({ row: r, col: c });
  }

  return cells;
}

function buildFillerPool(words: string[], difficulty: Difficulty): string {
  if (difficulty !== 'hard') return ALPHABET;

  const lettersInWords = words.join('').toUpperCase().replace(/[^A-Z]/g, '');
  const biased = lettersInWords.repeat(3);
  let extra = '';
  for (let i = 0; i < 10; i++) {
    extra += ALPHABET[randomInt(ALPHABET.length)];
  }
  return biased + extra;
}

export function generateWordSearch(config: WordSearchConfig): WordSearchResult {
  const { gridSize, difficulty, words } = config;
  const size = gridSize;

  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill(''),
  );

  const directions = DIRECTIONS_BY_DIFFICULTY[difficulty];
  const placements: WordPlacement[] = [];
  const placedWords: string[] = [];
  const failedWords: string[] = [];

  const uppercased = words.map((w) => w.toUpperCase());

  for (const word of uppercased) {
    let placed = false;

    for (let attempt = 0; attempt < 100; attempt++) {
      const direction = directions[randomInt(directions.length)];
      const row = randomInt(size);
      const col = randomInt(size);

      const cells = tryPlace(grid, word, row, col, direction, size);
      if (!cells) continue;

      for (let i = 0; i < word.length; i++) {
        grid[cells[i].row][cells[i].col] = word[i];
      }

      placements.push({ word, startRow: row, startCol: col, direction, cells });
      placedWords.push(word);
      placed = true;
      break;
    }

    if (!placed) {
      failedWords.push(word);
    }
  }

  const pool = buildFillerPool(uppercased, difficulty);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = pool[randomInt(pool.length)];
      }
    }
  }

  return { grid, placements, placedWords, failedWords };
}

export default generateWordSearch;
