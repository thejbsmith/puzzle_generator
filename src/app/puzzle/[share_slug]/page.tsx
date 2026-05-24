import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WordSearchGrid } from '@/components/puzzle/WordSearchGrid';
import { Badge } from '@/components/ui/badge';
import PrintControls from './PrintControls';

interface PageProps {
  params: Promise<{ share_slug: string }>;
}

export default async function PuzzlePage({ params }: PageProps) {
  const { share_slug } = await params;
  const supabase = await createClient();

  const { data: puzzle, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('share_slug', share_slug)
    .single();

  if (error || !puzzle) notFound();

  const grid = puzzle.grid as string[][];
  const words = puzzle.words as string[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="print:hidden flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{puzzle.theme}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">{puzzle.difficulty}</Badge>
            <span className="text-sm text-zinc-400">{puzzle.size} × {puzzle.size}</span>
          </div>
        </div>
        <PrintControls />
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">{puzzle.theme} Word Search</h1>
        <p className="text-sm text-gray-500">{puzzle.difficulty} · {puzzle.size} × {puzzle.size}</p>
      </div>

      <WordSearchGrid grid={grid} words={words} shareSlug={share_slug} />
    </div>
  );
}
