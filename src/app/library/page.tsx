import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const { data: saves } = await supabase
    .from('user_puzzle_saves')
    .select(`
      saved_at,
      puzzles (
        share_slug, theme, size, difficulty, created_at
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  type PuzzleRow = { share_slug: string; theme: string; size: number; difficulty: string; created_at: string };
  const puzzles = (saves ?? []).flatMap((s) => {
    const raw = s.puzzles;
    if (!raw) return [];
    const p = (Array.isArray(raw) ? raw[0] : raw) as unknown as PuzzleRow;
    return p ? [{ ...p, saved_at: s.saved_at }] : [];
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold text-zinc-900">My Puzzle Library</h1>
      {puzzles.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 space-y-2">
          <p className="text-lg">No saved puzzles yet.</p>
          <p className="text-sm">
            <Link href="/" className="underline hover:text-zinc-600">Generate a puzzle</Link> to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {puzzles.map((p) => (
            <Link key={p.share_slug} href={`/puzzle/${p.share_slug}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.theme}</CardTitle>
                    <Badge variant="outline" className="capitalize">{p.difficulty}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-zinc-500">
                  {p.size} × {p.size} · Saved {new Date(p.saved_at).toLocaleDateString()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
