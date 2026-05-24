'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface WordChipInputProps {
  words: string[];
  onChange: (words: string[]) => void;
  maxWords?: number;
}

export function WordChipInput({ words, onChange, maxWords = 20 }: WordChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function showError(msg: string) {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 2000);
  }

  function tryAddWord(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (/\s/.test(trimmed)) {
      showError('One word at a time — no spaces');
      return;
    }

    const word = trimmed.toUpperCase().replace(/[^A-Z]/g, '');

    if (word.length < 3) {
      showError('Min 3 characters');
      return;
    }

    if (words.includes(word)) {
      setInputValue('');
      return;
    }

    if (words.length >= maxWords) {
      showError(`Max ${maxWords} words reached`);
      return;
    }

    onChange([...words, word]);
    setInputValue('');
    setError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      tryAddWord(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && words.length > 0) {
      onChange(words.slice(0, -1));
    } else {
      setError(null);
    }
  }

  function removeWord(word: string) {
    onChange(words.filter((w) => w !== word));
  }

  return (
    <div className="space-y-1.5">
      <div
        className="rounded-lg border border-zinc-200 p-2 flex flex-wrap gap-1.5 min-h-[2.75rem] focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-zinc-900 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {words.map((word) => (
          <span
            key={word}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800"
          >
            {word}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeWord(word); }}
              className="text-zinc-400 hover:text-zinc-700 leading-none"
              aria-label={`Remove ${word}`}
            >
              ×
            </button>
          </span>
        ))}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) tryAddWord(inputValue); }}
          placeholder={words.length === 0 ? 'Type a word, press Enter…' : ''}
          className="border-0 shadow-none focus-visible:ring-0 h-auto p-0 text-sm flex-1 min-w-[120px] bg-transparent"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-xs ${error ? 'text-red-500' : 'text-transparent'}`}>
          {error ?? 'placeholder'}
        </p>
        <p className="text-xs text-zinc-400">{words.length} / {maxWords} words</p>
      </div>
    </div>
  );
}
