'use server';

import { createClient } from '@/lib/supabase/server';
import type { SudokuDifficulty } from '@/lib/puzzle/types';

export async function saveSudoku(params: {
  puzzle: (number | null)[][];
  solution: number[][];
  difficulty: SudokuDifficulty;
}): Promise<{ share_slug?: string; error?: string }> {
  const { puzzle, solution, difficulty } = params;
  const share_slug = crypto.randomUUID().slice(0, 8);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('sudoku_puzzles').insert({
    share_slug,
    difficulty,
    puzzle,
    solution,
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };
  return { share_slug };
}
