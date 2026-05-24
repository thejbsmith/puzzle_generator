'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import { renameLibraryEntry } from '@/app/actions/renameLibraryEntry';

type PuzzleType = 'word_search' | 'sudoku';

interface Props {
  shareSlug: string;
  puzzleType: PuzzleType;
  currentName: string;
}

export function RenameEntryButton({ shareSlug, puzzleType, currentName }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setValue(currentName);
    setEditing(true);
  }

  function cancel(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setEditing(false);
    setValue(currentName);
  }

  function save(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    startTransition(async () => {
      await renameLibraryEntry(shareSlug, puzzleType, value);
      router.refresh();
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div
        className="relative z-10 flex items-center gap-1"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          className="h-6 w-36 rounded border border-zinc-300 bg-white px-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
          disabled={isPending}
        />
        <button onClick={save} disabled={isPending} className="text-green-600 hover:text-green-700 disabled:opacity-40">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={cancel} disabled={isPending} className="text-zinc-400 hover:text-zinc-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="relative z-10 text-zinc-300 hover:text-zinc-500 transition-colors"
      aria-label="Rename"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}
