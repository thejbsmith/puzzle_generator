-- Run this in the Supabase SQL editor or via the Supabase CLI

create table sudoku_puzzles (
  id uuid default gen_random_uuid() primary key,
  share_slug text unique not null,
  difficulty text not null check (difficulty in ('easy','medium','hard','expert')),
  puzzle jsonb not null,
  solution jsonb not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table sudoku_puzzles enable row level security;

-- Anyone can read any puzzle (for sharing by link)
create policy "Public read" on sudoku_puzzles
  for select using (true);

-- Allow insert for authenticated and anonymous users
create policy "Insert for all" on sudoku_puzzles
  for insert with check (created_by is null or auth.uid() = created_by);

-- Fast lookup by share slug
create index sudoku_puzzles_share_slug_idx on sudoku_puzzles (share_slug);
