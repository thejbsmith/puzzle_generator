'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { saveToLibrary } from '@/app/actions/saveToLibrary';
import { removeFromLibrary } from '@/app/actions/removeFromLibrary';
import { createClient } from '@/lib/supabase/client';

type PuzzleType = 'word_search' | 'sudoku';

interface Props {
  shareSlug: string;
  initialSaved: boolean;
  isSignedIn: boolean;
  puzzleType?: PuzzleType;
}

export function SaveToLibraryButton({
  shareSlug,
  initialSaved,
  isSignedIn,
  puzzleType = 'word_search',
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [hovered, setHovered] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!isSignedIn) {
      const supabase = createClient();
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback' },
      });
      return;
    }
    startTransition(async () => {
      if (saved) {
        const result = await removeFromLibrary(shareSlug, puzzleType);
        if (!result.error) setSaved(false);
      } else {
        const result = await saveToLibrary(shareSlug, puzzleType);
        if (!result.error) setSaved(true);
      }
    });
  };

  if (saved) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={isPending}
        className={hovered ? 'text-red-500 border-red-300' : 'text-green-600 border-green-300'}
      >
        {isPending ? 'Removing…' : hovered ? 'Remove' : 'Saved ✓'}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {!isSignedIn ? 'Sign in to save' : isPending ? 'Saving…' : 'Save to Library'}
    </Button>
  );
}
