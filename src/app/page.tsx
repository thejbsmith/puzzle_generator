'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { generateWordSearch } from '@/lib/puzzle/wordSearch';
import type { GridSize, Difficulty } from '@/lib/puzzle/types';

type WordSource = 'ai' | 'custom';

interface GenerationResult {
  words: string[];
  grid: string[][];
  theme: string;
  gridSize: GridSize;
  difficulty: Difficulty;
}

export default function HomePage() {
  const router = useRouter();
  const [theme, setTheme] = useState('');
  const [gridSize, setGridSize] = useState<GridSize>(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [wordSource] = useState<WordSource>('ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!theme.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    const { words, error: wordError } = await generateWords({ theme, difficulty, count: 20 });
    if (wordError || !words.length) {
      setError(wordError ?? 'No words returned from AI');
      setIsGenerating(false);
      return;
    }

    const puzzleResult = generateWordSearch({ gridSize, difficulty, words });
    setResult({
      words: puzzleResult.placedWords,
      grid: puzzleResult.grid,
      theme,
      gridSize,
      difficulty,
    });
    setIsGenerating(false);
  }

  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    setError(null);

    const { share_slug, error: saveError } = await savePuzzle({
      theme: result.theme,
      size: result.gridSize,
      difficulty: result.difficulty,
      grid: result.grid,
      words: result.words,
    });

    if (saveError || !share_slug) {
      setError(saveError ?? 'Failed to save puzzle');
      setIsSaving(false);
      return;
    }

    router.push(`/puzzle/${share_slug}`);
  }

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
        <Card className="ring-2 ring-zinc-900 shadow-md cursor-default">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Word Search</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-500">
            Find hidden words in a grid of letters
          </CardContent>
        </Card>

        {(['Sudoku', 'Crossword'] as const).map((type) => (
          <Card key={type} className="opacity-50 cursor-not-allowed">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{type}</CardTitle>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-zinc-500">
              {type === 'Sudoku' ? 'Fill the grid with numbers' : 'Fill in intersecting words'}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config form */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Your Puzzle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Word source */}
          <div className="space-y-1.5">
            <Label>Word Source</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border-2 border-zinc-900 bg-zinc-50 p-4 cursor-default">
                <p className="font-medium text-sm">AI Generated</p>
                <p className="text-xs text-zinc-500 mt-0.5">Words chosen by AI for your theme</p>
              </div>
              <div className="rounded-lg border-2 border-zinc-200 p-4 opacity-50 cursor-not-allowed relative">
                <Badge variant="secondary" className="absolute top-2 right-2 text-xs">Coming Soon</Badge>
                <p className="font-medium text-sm">Custom Word List</p>
                <p className="text-xs text-zinc-500 mt-0.5">Enter your own words</p>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
          )}

          <Button
            className="w-full h-12 text-base"
            onClick={handleGenerate}
            disabled={isGenerating || !theme.trim()}
          >
            {isGenerating ? 'Generating…' : 'Generate Puzzle'}
          </Button>
        </CardContent>
      </Card>

      {/* Result preview */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ready to Play!</CardTitle>
              <Badge variant="outline">{result.words.length} words</Badge>
            </div>
            <p className="text-sm text-zinc-500">Theme: {result.theme}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {result.words.map((word) => (
                <Badge key={word} variant="secondary">{word}</Badge>
              ))}
            </div>
            <Button
              className="w-full h-12 text-base"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save & Play →'}
            </Button>
            <p className="text-xs text-center text-zinc-400">
              Saves your puzzle and opens it for solving
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
