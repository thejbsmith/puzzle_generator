'use server';

import { createClient } from '@/lib/supabase/server';

export async function savePuzzle(params: {
  theme: string;
  size: number;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: string[][];
  words: string[];
}): Promise<{ share_slug?: string; error?: string }> {
  const { theme, size, difficulty, grid, words } = params;

  const share_slug = crypto.randomUUID().slice(0, 8);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('puzzles').insert({
    theme,
    size,
    difficulty,
    grid,
    words,
    share_slug,
    created_by: user?.id ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  return { share_slug };
}
