'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { saveToLibrary } from '@/app/actions/saveToLibrary';
import { createClient } from '@/lib/supabase/client';

interface Props {
  shareSlug: string;
  initialSaved: boolean;
  isSignedIn: boolean;
}

export function SaveToLibraryButton({ shareSlug, initialSaved, isSignedIn }: Props) {
  const [saved, setSaved] = useState(initialSaved);
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
      const result = await saveToLibrary(shareSlug);
      if (!result.error) setSaved(true);
    });
  };

  if (saved) {
    return (
      <Button variant="outline" size="sm" disabled className="text-green-600 border-green-300">
        Saved ✓
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {!isSignedIn ? 'Sign in to save' : isPending ? 'Saving…' : 'Save to Library'}
    </Button>
  );
}
