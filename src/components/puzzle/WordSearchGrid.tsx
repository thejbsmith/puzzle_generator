'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Cell { row: number; col: number }

interface WordSearchGridProps {
  grid: string[][];
  words: string[];
  shareSlug: string;
}

function getDirection(from: Cell, to: Cell): [number, number] | null {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (dr === 0 && dc === 0) return [0, 0];
  if (dr === 0) return [0, dc > 0 ? 1 : -1];
  if (dc === 0) return [dr > 0 ? 1 : -1, 0];
  if (Math.abs(dr) === Math.abs(dc)) return [dr > 0 ? 1 : -1, dc > 0 ? 1 : -1];
  return null;
}

function getCellsInLine(from: Cell, to: Cell): Cell[] | null {
  const dir = getDirection(from, to);
  if (!dir) return null;
  const [dr, dc] = dir;
  const steps = Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col));
  const cells: Cell[] = [];
  let { row, col } = from;
  for (let i = 0; i <= steps; i++) {
    cells.push({ row, col });
    row += dr;
    col += dc;
  }
  return cells;
}

export function WordSearchGrid({ grid, words, shareSlug }: WordSearchGridProps) {
  const gridSize = grid.length;
  const wordSet = new Set(words.map((w) => w.toUpperCase()));

  const [foundWordCells, setFoundWordCells] = useState<Map<string, Cell[]>>(new Map());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentSelection, setCurrentSelection] = useState<Cell[]>([]);
  const [selectionStart, setSelectionStart] = useState<Cell | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  // Load solve progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`puzzle-${shareSlug}`);
      if (!saved) return;
      const data = JSON.parse(saved) as { foundWords: string[]; foundWordCells: Record<string, Cell[]> };
      const fw = new Set(data.foundWords);
      const fwc = new Map(Object.entries(data.foundWordCells));
      setFoundWords(fw);
      setFoundWordCells(fwc);
      if (fw.size === wordSet.size) setIsComplete(true);
    } catch {}
  }, [shareSlug, wordSet.size]);

  const saveProgress = useCallback(
    (fw: Set<string>, fwc: Map<string, Cell[]>) => {
      try {
        localStorage.setItem(
          `puzzle-${shareSlug}`,
          JSON.stringify({
            foundWords: [...fw],
            foundWordCells: Object.fromEntries(fwc),
          }),
        );
      } catch {}
    },
    [shareSlug],
  );

  const getCellFromPoint = useCallback(
    (x: number, y: number): Cell | null => {
      if (!gridRef.current) return null;
      const rect = gridRef.current.getBoundingClientRect();
      const cellW = rect.width / gridSize;
      const cellH = rect.height / gridSize;
      const col = Math.floor((x - rect.left) / cellW);
      const row = Math.floor((y - rect.top) / cellH);
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null;
      return { row, col };
    },
    [gridSize],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      setSelectionStart(cell);
      setCurrentSelection([cell]);
    },
    [getCellFromPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!selectionStart) return;
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      const cells = getCellsInLine(selectionStart, cell);
      if (cells) setCurrentSelection(cells);
    },
    [selectionStart, getCellFromPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (!selectionStart || currentSelection.length < 2) {
      setSelectionStart(null);
      setCurrentSelection([]);
      return;
    }

    const selectedWord = currentSelection.map((c) => grid[c.row][c.col]).join('');
    const reversed = [...selectedWord].reverse().join('');

    const matchedWord =
      wordSet.has(selectedWord) && !foundWords.has(selectedWord)
        ? selectedWord
        : wordSet.has(reversed) && !foundWords.has(reversed)
          ? reversed
          : null;

    if (matchedWord) {
      const newFoundWords = new Set([...foundWords, matchedWord]);
      const newFoundWordCells = new Map(foundWordCells);
      newFoundWordCells.set(matchedWord, [...currentSelection]);
      setFoundWords(newFoundWords);
      setFoundWordCells(newFoundWordCells);
      saveProgress(newFoundWords, newFoundWordCells);
      if (newFoundWords.size === wordSet.size) setIsComplete(true);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 400);
    }

    setSelectionStart(null);
    setCurrentSelection([]);
  }, [selectionStart, currentSelection, grid, wordSet, foundWords, foundWordCells, saveProgress]);

  const selectionSet = new Set(currentSelection.map((c) => `${c.row},${c.col}`));
  const foundCellSet = new Set(
    [...foundWordCells.values()].flat().map((c) => `${c.row},${c.col}`),
  );

  return (
    <div className="space-y-6">
      {isComplete && (
        <div className="text-center py-6 bg-green-50 rounded-xl border border-green-200 print:hidden">
          <p className="text-2xl font-bold text-green-700">Puzzle Complete!</p>
          <p className="text-green-600 mt-1">You found all {words.length} words!</p>
        </div>
      )}

      {/* Grid */}
      <div
        ref={gridRef}
        className={`select-none touch-none rounded-lg overflow-hidden bg-white shadow border cursor-crosshair transition-colors ${
          wrongFlash ? 'border-red-400' : 'border-zinc-200'
        }`}
        style={{ aspectRatio: '1 / 1' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setSelectionStart(null);
          setCurrentSelection([]);
        }}
      >
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r},${c}`;
              const isFound = foundCellSet.has(key);
              const isSelected = selectionSet.has(key);
              return (
                <div
                  key={key}
                  className={`flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-colors ${
                    isFound
                      ? 'bg-green-200 text-green-900'
                      : isSelected
                        ? 'bg-blue-200 text-blue-900'
                        : 'text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  {letter}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Word list */}
      <div className="print-word-list">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3 print:hidden">
          Words ({foundWords.size}/{words.length})
        </h3>
        <h3 className="hidden print:block text-base font-semibold mb-3">Find these words:</h3>
        <div className="flex flex-wrap gap-2">
          {words.map((word) => (
            <span
              key={word}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                foundWords.has(word)
                  ? 'bg-green-100 border-green-200 text-green-700 line-through print:hidden'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
