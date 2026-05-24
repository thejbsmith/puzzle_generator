'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SudokuGridProps {
  puzzle: (number | null)[][];
  solution: number[][];
  shareSlug: string;
}

const CELL_CLASSES = 'aspect-square flex items-center justify-center text-base sm:text-lg font-medium select-none focus:outline-none';

function boxBorderStyle(row: number, col: number): React.CSSProperties {
  return {
    borderRight: col === 2 || col === 5 ? '2px solid #18181b' : '1px solid #d4d4d8',
    borderBottom: row === 2 || row === 5 ? '2px solid #18181b' : '1px solid #d4d4d8',
  };
}

export function SudokuGrid({ puzzle, solution, shareSlug }: SudokuGridProps) {
  const [userGrid, setUserGrid] = useState<(number | null)[][]>(() =>
    puzzle.map((row) => [...row]),
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`sudoku-${shareSlug}`);
      if (!saved) return;
      const data = JSON.parse(saved) as { userGrid: (number | null)[][] };
      setUserGrid(data.userGrid);
      // Check if already complete
      const flat = data.userGrid.flat();
      const solFlat = solution.flat();
      if (flat.every((v, i) => v === solFlat[i])) setIsComplete(true);
    } catch {}
  }, [shareSlug, solution]);

  const saveProgress = useCallback(
    (grid: (number | null)[][]) => {
      try {
        localStorage.setItem(`sudoku-${shareSlug}`, JSON.stringify({ userGrid: grid }));
      } catch {}
    },
    [shareSlug],
  );

  const isGiven = (r: number, c: number) => puzzle[r][c] !== null;

  function isConflict(r: number, c: number, grid: (number | null)[][]): boolean {
    const v = grid[r][c];
    if (v === null || isGiven(r, c)) return false;

    for (let i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === v) return true;
      if (i !== r && grid[i][c] === v) return true;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const nr = br + dr;
        const nc = bc + dc;
        if ((nr !== r || nc !== c) && grid[nr][nc] === v) return true;
      }
    }
    return false;
  }

  function isSameBox(r1: number, c1: number, r2: number, c2: number) {
    return Math.floor(r1 / 3) === Math.floor(r2 / 3) && Math.floor(c1 / 3) === Math.floor(c2 / 3);
  }

  function cellHighlight(r: number, c: number): string {
    if (!selected) return '';
    const [sr, sc] = selected;
    if (r === sr && c === sc) return 'bg-blue-200';
    if (r === sr || c === sc || isSameBox(r, c, sr, sc)) return 'bg-blue-50';
    return '';
  }

  function fillCell(r: number, c: number, value: number | null) {
    if (isGiven(r, c)) return;
    const next = userGrid.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? value : cell)),
    );
    setUserGrid(next);
    saveProgress(next);

    const solFlat = solution.flat();
    if (next.flat().every((v, i) => v === solFlat[i])) setIsComplete(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!selected) return;
    const [r, c] = selected;

    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      fillCell(r, c, Number(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      e.preventDefault();
      fillCell(r, c, null);
    } else if (e.key === 'ArrowUp' && r > 0) {
      e.preventDefault();
      setSelected([r - 1, c]);
    } else if (e.key === 'ArrowDown' && r < 8) {
      e.preventDefault();
      setSelected([r + 1, c]);
    } else if (e.key === 'ArrowLeft' && c > 0) {
      e.preventDefault();
      setSelected([r, c - 1]);
    } else if (e.key === 'ArrowRight' && c < 8) {
      e.preventDefault();
      setSelected([r, c + 1]);
    }
  }

  return (
    <div className="space-y-6">
      {isComplete && (
        <div className="text-center py-6 bg-green-50 rounded-xl border border-green-200">
          <p className="text-2xl font-bold text-green-700">Puzzle Complete!</p>
          <p className="text-green-600 mt-1">Well done!</p>
        </div>
      )}

      {/* Grid */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="border-2 border-zinc-900 rounded-lg overflow-hidden max-w-sm mx-auto focus:outline-none"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)' }}
      >
        {userGrid.map((row, r) =>
          row.map((cell, c) => {
            const given = isGiven(r, c);
            const conflict = isConflict(r, c, userGrid);
            const highlight = cellHighlight(r, c);
            const isSelected = selected?.[0] === r && selected?.[1] === c;

            return (
              <div
                key={`${r}-${c}`}
                className={`${CELL_CLASSES} ${given ? 'text-zinc-900 font-bold' : conflict ? 'text-red-500' : 'text-blue-700'} ${given ? 'bg-zinc-100' : highlight || 'bg-white'} ${!given ? 'cursor-pointer hover:bg-blue-50' : ''} ${isSelected ? 'bg-blue-200' : ''}`}
                style={boxBorderStyle(r, c)}
                onClick={() => setSelected([r, c])}
              >
                {cell ?? ''}
              </div>
            );
          }),
        )}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => selected && fillCell(selected[0], selected[1], n)}
            className="h-10 w-full rounded-lg border border-zinc-200 font-medium text-sm hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => selected && fillCell(selected[0], selected[1], null)}
          className="h-10 w-full rounded-lg border border-zinc-200 font-medium text-sm hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-zinc-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
