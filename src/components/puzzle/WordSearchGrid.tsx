'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Cell { row: number; col: number }

interface WordSearchGridProps {
  grid: string[][];
  words: string[];
  shareSlug: string;
}

const CIRCLE_COLORS = [
  '#4ade80', // green
  '#fb923c', // orange
  '#818cf8', // indigo
  '#f472b6', // pink
  '#22d3ee', // cyan
  '#a78bfa', // violet
  '#facc15', // yellow
  '#34d399', // emerald
  '#f87171', // red
  '#60a5fa', // blue
];

interface PillProps {
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
  filled: boolean;
}

function PillShape({ x1, y1, x2, y2, color, filled }: PillProps) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const h = 0.78;
  const w = Math.max(length + h, h);

  return (
    <rect
      x={-w / 2}
      y={-h / 2}
      width={w}
      height={h}
      rx={h / 2}
      ry={h / 2}
      fill={filled ? color : 'none'}
      fillOpacity={filled ? 0.38 : 0}
      stroke={color}
      strokeWidth="0.1"
      strokeOpacity="0.85"
      transform={`translate(${cx},${cy}) rotate(${angle})`}
    />
  );
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
  // Color index assigned at the moment each word was found (order-of-discovery)
  const [foundWordColors, setFoundWordColors] = useState<Map<string, number>>(new Map());
  const [currentSelection, setCurrentSelection] = useState<Cell[]>([]);
  const [selectionStart, setSelectionStart] = useState<Cell | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  // Controls whether found-word circles show their background fill (outline is always visible)
  const [showFoundFill, setShowFoundFill] = useState(true);

  const gridRef = useRef<HTMLDivElement>(null);

  // Active selection uses the same index the next found word will receive,
  // so the outline color transitions seamlessly into the filled circle.
  const selectionColor = CIRCLE_COLORS[foundWords.size % CIRCLE_COLORS.length];

  useEffect(() => {
    try {
      const mode = localStorage.getItem('puzzle-highlight-mode');
      if (mode === 'outline') setShowFoundFill(false);

      const saved = localStorage.getItem(`puzzle-${shareSlug}`);
      if (!saved) return;
      const data = JSON.parse(saved) as {
        foundWords: string[];
        foundWordCells: Record<string, Cell[]>;
        foundWordColors?: Record<string, number>;
      };
      const fw = new Set(data.foundWords);
      const fwc = new Map(Object.entries(data.foundWordCells));
      const fwColors = new Map(Object.entries(data.foundWordColors ?? {}).map(([k, v]) => [k, v as number]));
      setFoundWords(fw);
      setFoundWordCells(fwc);
      setFoundWordColors(fwColors);
      if (fw.size === wordSet.size) setIsComplete(true);
    } catch {}
  }, [shareSlug, wordSet.size]);

  const toggleShowFoundFill = useCallback(() => {
    setShowFoundFill((prev) => {
      const next = !prev;
      try { localStorage.setItem('puzzle-highlight-mode', next ? 'fill' : 'outline'); } catch {}
      return next;
    });
  }, []);

  const saveProgress = useCallback(
    (fw: Set<string>, fwc: Map<string, Cell[]>, fwColors: Map<string, number>) => {
      try {
        localStorage.setItem(
          `puzzle-${shareSlug}`,
          JSON.stringify({
            foundWords: [...fw],
            foundWordCells: Object.fromEntries(fwc),
            foundWordColors: Object.fromEntries(fwColors),
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
      const colorIdx = foundWords.size % CIRCLE_COLORS.length; // assign before updating size
      const newFoundWords = new Set([...foundWords, matchedWord]);
      const newFoundWordCells = new Map(foundWordCells);
      newFoundWordCells.set(matchedWord, [...currentSelection]);
      const newFoundWordColors = new Map(foundWordColors);
      newFoundWordColors.set(matchedWord, colorIdx);
      setFoundWords(newFoundWords);
      setFoundWordCells(newFoundWordCells);
      setFoundWordColors(newFoundWordColors);
      saveProgress(newFoundWords, newFoundWordCells, newFoundWordColors);
      if (newFoundWords.size === wordSet.size) setIsComplete(true);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 400);
    }

    setSelectionStart(null);
    setCurrentSelection([]);
  }, [selectionStart, currentSelection, grid, wordSet, foundWords, foundWordCells, foundWordColors, saveProgress]);

  const selectionFirst = currentSelection[0];
  const selectionLast = currentSelection[currentSelection.length - 1];

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
        className={`puzzle-grid relative select-none touch-none rounded-lg overflow-hidden bg-white shadow border cursor-crosshair transition-colors ${
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
            row.map((letter, c) => (
              <div
                key={`${r},${c}`}
                className="flex items-center justify-center font-mono font-bold text-xs sm:text-sm text-zinc-700"
              >
                {letter}
              </div>
            )),
          )}
        </div>

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${gridSize} ${gridSize}`}
        >
          {/* Active selection: always outline-only, using the next-up color */}
          {selectionFirst && selectionLast && currentSelection.length >= 2 && (
            <PillShape
              x1={selectionFirst.col + 0.5}
              y1={selectionFirst.row + 0.5}
              x2={selectionLast.col + 0.5}
              y2={selectionLast.row + 0.5}
              color={selectionColor}
              filled={false}
            />
          )}

          {/* Found-word circles: outline always visible, fill toggled by showFoundFill */}
          {[...foundWordCells.entries()].map(([word, cells]) => {
            if (cells.length === 0) return null;
            const first = cells[0];
            const last = cells[cells.length - 1];
            const colorIdx = foundWordColors.get(word) ?? 0;
            return (
              <PillShape
                key={word}
                x1={first.col + 0.5}
                y1={first.row + 0.5}
                x2={last.col + 0.5}
                y2={last.row + 0.5}
                color={CIRCLE_COLORS[colorIdx]}
                filled={showFoundFill}
              />
            );
          })}
        </svg>
      </div>

      {/* Word list */}
      <div className="print-word-list">
        <div className="flex items-center justify-between mb-3 print:hidden">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Words ({foundWords.size}/{words.length})
          </h3>
          <button
            onClick={toggleShowFoundFill}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors border border-zinc-200 rounded px-2 py-0.5"
          >
            {showFoundFill ? 'Highlights: fill' : 'Highlights: outline'}
          </button>
        </div>
        <h3 className="hidden print:block text-base font-semibold mb-2">Find these words:</h3>
        <div className="flex flex-wrap gap-2 print:grid print:grid-cols-4 print:gap-1">
          {words.map((word) => {
            const isFound = foundWords.has(word);
            const colorIdx = foundWordColors.get(word) ?? 0;
            const color = isFound ? CIRCLE_COLORS[colorIdx] : null;
            return (
              <span
                key={word}
                style={isFound && color ? { borderColor: color, backgroundColor: `${color}33` } : {}}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all print:text-xs print:px-1.5 print:py-0.5 ${
                  isFound
                    ? 'text-zinc-800 line-through print:hidden'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
