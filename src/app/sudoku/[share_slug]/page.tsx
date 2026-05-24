import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SudokuGrid } from '@/components/puzzle/SudokuGrid';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ share_slug: string }>;
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

  const puzzle = row.puzzle as (number | null)[][];
  const solution = row.solution as number[][];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Sudoku</h1>
        <Badge variant="outline" className="capitalize mt-1">{row.difficulty}</Badge>
      </div>
      <SudokuGrid puzzle={puzzle} solution={solution} shareSlug={share_slug} />
    </div>
  );
}
