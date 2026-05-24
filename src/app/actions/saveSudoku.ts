'use server';

import { createClient } from '@/lib/supabase/server';
import type { SudokuDifficulty } from '@/lib/puzzle/types';

export async function saveSudoku(params: {
  puzzle: (number | null)[][];
  solution: number[][];
  difficulty: SudokuDifficulty;
  nickname?: string;
}): Promise<{ share_slug?: string; error?: string }> {
  const { puzzle, solution, difficulty, nickname } = params;
  const share_slug = crypto.randomUUID().slice(0, 8);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inserted, error } = await supabase
    .from('sudoku_puzzles')
    .insert({
      share_slug,
      difficulty,
      puzzle,
      solution,
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
      puzzle_type: 'sudoku',
      sudoku_puzzle_id: inserted.id,
      nickname: nickname.trim(),
    });
  }

  return { share_slug };
}
