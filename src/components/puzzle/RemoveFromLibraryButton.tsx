'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeFromLibrary } from '@/app/actions/removeFromLibrary';

export function RemoveFromLibraryButton({ shareSlug }: { shareSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await removeFromLibrary(shareSlug);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="relative z-10 text-zinc-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-40"
      aria-label="Remove from library"
    >
      ×
    </button>
  );
}
