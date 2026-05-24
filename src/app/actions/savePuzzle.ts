'use server';

import { createClient } from '@/lib/supabase/server';

export async function savePuzzle(params: {
  theme: string;
  size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: string[][];
  words: string[];
  nickname?: string;
}): Promise<{ share_slug?: string; error?: string }> {
  const { theme, size, difficulty, grid, words, nickname } = params;

  const share_slug = crypto.randomUUID().slice(0, 8);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inserted, error } = await supabase
    .from('puzzles')
    .insert({
      theme,
      size,
      difficulty,
      grid,
      words,
      share_slug,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? 'Insert failed' };
  }

  // Auto-save to library with nickname if user is signed in and provided a name
  if (user && nickname?.trim()) {
    await supabase.from('user_puzzle_saves').insert({
      user_id: user.id,
      puzzle_type: 'word_search',
      puzzle_id: inserted.id,
      nickname: nickname.trim(),
    });
  }

  return { share_slug };
}
