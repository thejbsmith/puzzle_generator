create table if not exists puzzles (
  id uuid primary key default gen_random_uuid(),
  share_slug text unique not null,
  theme text not null,
  size integer not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  grid jsonb not null,
  words jsonb not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create table if not exists user_puzzle_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  puzzle_id uuid references puzzles(id) not null,
  solve_progress jsonb,
  saved_at timestamptz default now(),
  unique(user_id, puzzle_id)
);

alter table puzzles enable row level security;
alter table user_puzzle_saves enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'puzzles' and policyname = 'puzzles are publicly readable') then
    create policy "puzzles are publicly readable" on puzzles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'puzzles' and policyname = 'authenticated users can create puzzles') then
    create policy "anyone can create puzzles" on puzzles for insert with check (created_by is null or auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_puzzle_saves' and policyname = 'users own their saves') then
    create policy "users own their saves" on user_puzzle_saves using (auth.uid() = user_id);
  end if;
end $$;
