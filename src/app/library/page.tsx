import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RemoveFromLibraryButton } from '@/components/puzzle/RemoveFromLibraryButton';
import { RenameEntryButton } from '@/components/puzzle/RenameEntryButton';
import Link from 'next/link';

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center space-y-4">
        <h1 className="text-3xl font-bold text-zinc-900">My Puzzle Library</h1>
        <p className="text-zinc-500">Sign in to save and view your puzzles.</p>
        <p className="text-sm text-zinc-400">
          Use the <span className="font-medium">Sign in with Google</span> button in the top right.
        </p>
      </div>
    );
  }

  const { data: wsSaves } = await supabase
    .from('user_puzzle_saves')
    .select('saved_at, nickname, puzzles(share_slug, theme, size, difficulty)')
    .eq('user_id', user.id)
    .eq('puzzle_type', 'word_search')
    .order('saved_at', { ascending: false });

  const { data: sudokuSaves } = await supabase
    .from('user_puzzle_saves')
    .select('saved_at, nickname, sudoku_puzzles(share_slug, difficulty)')
    .eq('user_id', user.id)
    .eq('puzzle_type', 'sudoku')
    .order('saved_at', { ascending: false });

  type WordSearchRow = { share_slug: string; theme: string; size: number; difficulty: string };
  type SudokuRow = { share_slug: string; difficulty: string };

  const wordSearchPuzzles = (wsSaves ?? []).flatMap((s) => {
    const raw = s.puzzles;
    if (!raw) return [];
    const p = (Array.isArray(raw) ? raw[0] : raw) as unknown as WordSearchRow;
    return p ? [{ ...p, saved_at: s.saved_at, nickname: s.nickname as string | null }] : [];
  });

  const sudokuPuzzles = (sudokuSaves ?? []).flatMap((s) => {
    const raw = s.sudoku_puzzles;
    if (!raw) return [];
    const p = (Array.isArray(raw) ? raw[0] : raw) as unknown as SudokuRow;
    return p ? [{ ...p, saved_at: s.saved_at, nickname: s.nickname as string | null }] : [];
  });

  const totalSaved = wordSearchPuzzles.length + sudokuPuzzles.length;

  // Each section config — add new puzzle types here as they ship
  const sections = [
    {
      type: 'word_search' as const,
      label: 'Word Search',
      puzzles: wordSearchPuzzles,
      renderCard: (p: WordSearchRow & { saved_at: string; nickname: string | null }) => {
        const displayName = p.nickname || p.theme;
        return (
          <Card key={p.share_slug} className="relative hover:shadow-md transition-shadow cursor-pointer">
            <Link href={`/puzzle/${p.share_slug}`} className="absolute inset-0 z-0" aria-label={displayName} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base truncate">{displayName}</CardTitle>
                <div className="flex items-center gap-1.5 shrink-0">
                  <RenameEntryButton
                    shareSlug={p.share_slug}
                    puzzleType="word_search"
                    currentName={p.nickname ?? p.theme}
                  />
                  <Badge variant="outline" className="capitalize">{p.difficulty}</Badge>
                  <RemoveFromLibraryButton shareSlug={p.share_slug} puzzleType="word_search" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-zinc-500">
              {p.size} × {p.size} · Saved {new Date(p.saved_at).toLocaleDateString()}
            </CardContent>
          </Card>
        );
      },
    },
    {
      type: 'sudoku' as const,
      label: 'Sudoku',
      puzzles: sudokuPuzzles,
      renderCard: (p: SudokuRow & { saved_at: string; nickname: string | null }) => {
        const displayName = p.nickname || `${p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)} Sudoku`;
        return (
          <Card key={p.share_slug} className="relative hover:shadow-md transition-shadow cursor-pointer">
            <Link href={`/sudoku/${p.share_slug}`} className="absolute inset-0 z-0" aria-label={displayName} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base truncate">{displayName}</CardTitle>
                <div className="flex items-center gap-1.5 shrink-0">
                  <RenameEntryButton
                    shareSlug={p.share_slug}
                    puzzleType="sudoku"
                    currentName={p.nickname ?? displayName}
                  />
                  <Badge variant="outline" className="capitalize">{p.difficulty}</Badge>
                  <RemoveFromLibraryButton shareSlug={p.share_slug} puzzleType="sudoku" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-zinc-500">
              Saved {new Date(p.saved_at).toLocaleDateString()}
            </CardContent>
          </Card>
        );
      },
    },
  ].filter((s) => s.puzzles.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-zinc-900">My Puzzle Library</h1>

      {totalSaved === 0 ? (
        <div className="text-center py-20 text-zinc-400 space-y-2">
          <p className="text-lg">No saved puzzles yet.</p>
          <p className="text-sm">
            <Link href="/" className="underline hover:text-zinc-600">Generate a puzzle</Link> to get started.
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.type} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-zinc-700">{section.label}</h2>
              <Badge variant="secondary">{section.puzzles.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {section.puzzles.map((p: any) => section.renderCard(p))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
