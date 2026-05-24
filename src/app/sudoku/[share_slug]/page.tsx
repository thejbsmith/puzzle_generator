import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SudokuGrid } from '@/components/puzzle/SudokuGrid';
import { Badge } from '@/components/ui/badge';
import { SaveToLibraryButton } from '@/components/puzzle/SaveToLibraryButton';
import { ShareButton } from '@/components/puzzle/ShareButton';

interface PageProps {
  params: Promise<{ share_slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { share_slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('sudoku_puzzles')
    .select('difficulty')
    .eq('share_slug', share_slug)
    .single();

  if (!data) return { title: 'Sudoku | Puzzle Generator' };

  const cap = data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);
  const title = `${cap} Sudoku`;
  const description = `A ${data.difficulty} difficulty Sudoku puzzle`;

  return {
    title,
    description,
    openGraph: { title, description, siteName: 'Puzzle Generator', type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function SudokuPage({ params }: PageProps) {
  const { share_slug } = await params;
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from('sudoku_puzzles')
    .select('*')
    .eq('share_slug', share_slug)
    .single();

  if (error || !row) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  let isSaved = false;
  if (user) {
    const { data } = await supabase
      .from('user_puzzle_saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('sudoku_puzzle_id', row.id)
      .maybeSingle();
    isSaved = !!data;
  }

  const puzzle = row.puzzle as (number | null)[][];
  const solution = row.solution as number[][];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sudoku</h1>
          <Badge variant="outline" className="capitalize mt-1">{row.difficulty}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton title={`${row.difficulty} Sudoku`} />
          <SaveToLibraryButton
            shareSlug={share_slug}
            initialSaved={isSaved}
            isSignedIn={!!user}
            puzzleType="sudoku"
          />
        </div>
      </div>
      <SudokuGrid puzzle={puzzle} solution={solution} shareSlug={share_slug} />
    </div>
  );
}
