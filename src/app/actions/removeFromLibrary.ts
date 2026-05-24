'use server';

import { createClient } from '@/lib/supabase/server';

export async function removeFromLibrary(shareSlug: string): Promise<{ error?: string }> {
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
    .delete()
    .eq('user_id', user.id)
    .eq('puzzle_id', puzzle.id);

  if (error) return { error: error.message };
  return {};
}
