'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateWords } from '@/app/actions/generateWords';
import { savePuzzle } from '@/app/actions/savePuzzle';
import { saveSudoku } from '@/app/actions/saveSudoku';
import { generateWordSearch } from '@/lib/puzzle/wordSearch';
import { generateSudokuPuzzle } from '@/lib/puzzle/sudoku';
import { WordChipInput } from '@/components/puzzle/WordChipInput';
import { createClient } from '@/lib/supabase/client';
import type { GridSize, Difficulty, SudokuDifficulty } from '@/lib/puzzle/types';

type WordSource = 'ai' | 'custom';
type PuzzleType = 'word-search' | 'sudoku';

interface WordSearchResult {
  words: string[];
  grid: string[][];
  theme: string;
  gridSize: GridSize;
  difficulty: Difficulty;
}

interface SudokuResult {
  puzzle: (number | null)[][];
  solution: number[][];
  difficulty: SudokuDifficulty;
}

export default function HomePage() {
  const router = useRouter();

  // Auth
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Puzzle type
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('word-search');

  // Word search config
  const [theme, setTheme] = useState('');
  const [gridSize, setGridSize] = useState<GridSize>(15);
  const [wordSource, setWordSource] = useState<WordSource>('ai');
  const [customWords, setCustomWords] = useState<string[]>([]);

  // Shared config
  const [difficulty, setDifficulty] = useState<Difficulty | SudokuDifficulty>('medium');

  // Nicknames for library save
  const [wordSearchNickname, setWordSearchNickname] = useState('');
  const [sudokuNickname, setSudokuNickname] = useState('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordSearchResult, setWordSearchResult] = useState<WordSearchResult | null>(null);
  const [sudokuResult, setSudokuResult] = useState<SudokuResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectPuzzleType(type: PuzzleType) {
    setPuzzleType(type);
    setWordSearchResult(null);
    setSudokuResult(null);
    setError(null);
    if (type === 'sudoku' && difficulty === 'hard') {
      // keep difficulty; expert is also valid for sudoku
    }
  }

  async function handleGenerate() {
    setError(null);

    if (puzzleType === 'sudoku') {
      setIsGenerating(true);
      setSudokuResult(null);
      setSudokuNickname('');
      try {
        const result = generateSudokuPuzzle({ difficulty: difficulty as SudokuDifficulty });
        setSudokuResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate puzzle');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Word search
    if (wordSource === 'ai' && !theme.trim()) return;
    if (wordSource === 'custom' && customWords.length < 3) {
      setError('Please add at least 3 words');
      return;
    }

    setIsGenerating(true);
    setWordSearchResult(null);
    setWordSearchNickname('');

    let words: string[];
    if (wordSource === 'custom') {
      words = customWords;
    } else {
      const { words: aiWords, error: wordError } = await generateWords({
        theme,
        difficulty: difficulty as Difficulty,
        count: 20,
      });
      if (wordError || !aiWords.length) {
        setError(wordError ?? 'No words returned from AI');
        setIsGenerating(false);
        return;
      }
      words = aiWords;
    }

    const puzzleResult = generateWordSearch({ gridSize, difficulty: difficulty as Difficulty, words });
    setWordSearchResult({
      words: puzzleResult.placedWords,
      grid: puzzleResult.grid,
      theme: wordSource === 'custom' ? 'Custom' : theme,
      gridSize,
      difficulty: difficulty as Difficulty,
    });
    setIsGenerating(false);
  }

  async function handleSaveWordSearch() {
    if (!wordSearchResult) return;
    setIsSaving(true);
    setError(null);

    const { share_slug, error: saveError } = await savePuzzle({
      theme: wordSearchResult.theme,
      size: wordSearchResult.gridSize,
      difficulty: wordSearchResult.difficulty,
      grid: wordSearchResult.grid,
      words: wordSearchResult.words,
      nickname: wordSearchNickname.trim() || undefined,
    });

    if (saveError || !share_slug) {
      setError(saveError ?? 'Failed to save puzzle');
      setIsSaving(false);
      return;
    }

    router.push(`/puzzle/${share_slug}`);
  }

  async function handleSaveSudoku() {
    if (!sudokuResult) return;
    setIsSaving(true);
    setError(null);

    const { share_slug, error: saveError } = await saveSudoku({
      puzzle: sudokuResult.puzzle,
      solution: sudokuResult.solution,
      difficulty: sudokuResult.difficulty,
      nickname: sudokuNickname.trim() || undefined,
    });

    if (saveError || !share_slug) {
      setError(saveError ?? 'Failed to save puzzle');
      setIsSaving(false);
      return;
    }

    router.push(`/sudoku/${share_slug}`);
  }

  const generateDisabled =
    isGenerating ||
    (puzzleType === 'word-search' &&
      (wordSource === 'ai' ? !theme.trim() : customWords.length < 3));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Create Beautiful Puzzles
        </h1>
        <p className="text-zinc-500 text-lg">Powered by AI</p>
      </div>

      {/* Puzzle type selector */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            puzzleType === 'word-search'
              ? 'ring-2 ring-zinc-900 shadow-md'
              : 'hover:shadow-md border'
          }`}
          onClick={() => selectPuzzleType('word-search')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Word Search</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Find hidden words in a grid of letters
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            puzzleType === 'sudoku'
              ? 'ring-2 ring-zinc-900 shadow-md'
              : 'hover:shadow-md border'
          }`}
          onClick={() => selectPuzzleType('sudoku')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sudoku</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Fill the grid with numbers
          </CardContent>
        </Card>

        <Card className="opacity-50 cursor-not-allowed">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Crossword</CardTitle>
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Fill in intersecting words
          </CardContent>
        </Card>
      </div>

      {/* Config form */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Your Puzzle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Theme — word search + AI only */}
          {puzzleType === 'word-search' && wordSource === 'ai' && (
            <div className="space-y-1.5">
              <Label htmlFor="theme">Theme</Label>
              <Input
                id="theme"
                placeholder="e.g. Ocean Animals, Space Exploration"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="h-12"
              />
            </div>
          )}

          <div className={`grid gap-4 ${puzzleType === 'word-search' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Grid Size — word search only */}
            {puzzleType === 'word-search' && (
              <div className="space-y-1.5">
                <Label>Grid Size</Label>
                <Select value={String(gridSize)} onValueChange={(v) => setGridSize(Number(v) as GridSize)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 × 10</SelectItem>
                    <SelectItem value="15">15 × 15</SelectItem>
                    <SelectItem value="20">20 × 20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty | SudokuDifficulty)}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  {puzzleType === 'sudoku' && (
                    <SelectItem value="expert">Expert</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Word source — word search only */}
          {puzzleType === 'word-search' && (
            <div className="space-y-1.5">
              <Label>Word Source</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    wordSource === 'ai'
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                  onClick={() => setWordSource('ai')}
                >
                  <p className="font-medium text-sm">AI Generated</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Words chosen by AI for your theme</p>
                </div>
                <div
                  className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    wordSource === 'custom'
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                  onClick={() => setWordSource('custom')}
                >
                  <p className="font-medium text-sm">Custom Word List</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Enter your own words</p>
                </div>
              </div>

              {wordSource === 'custom' && (
                <div className="mt-3">
                  <WordChipInput words={customWords} onChange={setCustomWords} maxWords={20} />
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}

          <Button
            className="w-full h-12 text-base"
            onClick={handleGenerate}
            disabled={generateDisabled}
          >
            {isGenerating
              ? 'Generating…'
              : puzzleType === 'sudoku'
                ? 'Generate Sudoku'
                : 'Generate Puzzle'}
          </Button>
        </CardContent>
      </Card>

      {/* Word search result preview */}
      {wordSearchResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ready to Play!</CardTitle>
              <Badge variant="outline">{wordSearchResult.words.length} words</Badge>
            </div>
            <p className="text-sm text-zinc-500">Theme: {wordSearchResult.theme}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {wordSearchResult.words.map((word) => (
                <Badge key={word} variant="secondary">{word}</Badge>
              ))}
            </div>
            {user && (
              <div className="space-y-1.5">
                <Label htmlFor="ws-nickname" className="text-xs text-zinc-500">
                  Name this puzzle (optional — saves to your library)
                </Label>
                <Input
                  id="ws-nickname"
                  placeholder={wordSearchResult.theme}
                  value={wordSearchNickname}
                  onChange={(e) => setWordSearchNickname(e.target.value)}
                  className="h-10"
                />
              </div>
            )}
            <Button
              className="w-full h-12 text-base"
              onClick={handleSaveWordSearch}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save & Play →'}
            </Button>
            <p className="text-xs text-center text-zinc-400">
              {user && wordSearchNickname.trim()
                ? 'Saves to your library and opens for solving'
                : 'Saves your puzzle and opens it for solving'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sudoku result preview */}
      {sudokuResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sudoku Ready!</CardTitle>
              <Badge variant="outline" className="capitalize">{sudokuResult.difficulty}</Badge>
            </div>
            <p className="text-sm text-zinc-500">
              {81 - sudokuResult.puzzle.flat().filter((c) => c === null).length} given clues
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="space-y-1.5">
                <Label htmlFor="sudoku-nickname" className="text-xs text-zinc-500">
                  Name this puzzle (optional — saves to your library)
                </Label>
                <Input
                  id="sudoku-nickname"
                  placeholder={`${sudokuResult.difficulty.charAt(0).toUpperCase() + sudokuResult.difficulty.slice(1)} Sudoku`}
                  value={sudokuNickname}
                  onChange={(e) => setSudokuNickname(e.target.value)}
                  className="h-10"
                />
              </div>
            )}
            <Button
              className="w-full h-12 text-base"
              onClick={handleSaveSudoku}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save & Play →'}
            </Button>
            <p className="text-xs text-center text-zinc-400">
              {user && sudokuNickname.trim()
                ? 'Saves to your library and opens for solving'
                : 'Saves your puzzle and opens it for solving'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
