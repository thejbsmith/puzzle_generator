'use server';

import { createClient } from '@/lib/supabase/server';

export async function saveToLibrary(shareSlug: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not signed in' };

  const { data: puzzle } = await supabase
    .from('puzzles')
    .select('id')
    .eq('share_slug', shareSlug)
    .single();

  if (!puzzle) return { error: 'Puzzle not found' };

  const { error } = await supabase
    .from('user_puzzle_saves')
    .insert({ user_id: user.id, puzzle_id: puzzle.id });

  if (error && error.code !== '23505') return { error: error.message };

  return {};
}
