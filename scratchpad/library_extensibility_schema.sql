-- Make user_puzzle_saves polymorphic so it can hold any puzzle type.
-- Pattern: puzzle_type column + one nullable FK per puzzle type.
-- Adding a new puzzle type = add one FK column + one enum value + one partial unique index.

-- 1. Make puzzle_id nullable (existing rows stay as-is with 'word_search' type)
alter table user_puzzle_saves
  alter column puzzle_id drop not null;

-- 2. Add puzzle_type column (backfills all existing rows as 'word_search')
alter table user_puzzle_saves
  add column puzzle_type text not null default 'word_search';

-- 3. Add sudoku FK column
alter table user_puzzle_saves
  add column sudoku_puzzle_id uuid references sudoku_puzzles(id) on delete cascade;

-- 4. Enforce exactly one puzzle reference per row
alter table user_puzzle_saves
  add constraint user_puzzle_saves_one_type check (
    (puzzle_type = 'word_search' and puzzle_id is not null and sudoku_puzzle_id is null) or
    (puzzle_type = 'sudoku' and sudoku_puzzle_id is not null and puzzle_id is null)
  );

-- 5. Unique index for sudoku saves (word_search already has its own constraint)
create unique index user_puzzle_saves_sudoku_uniq
  on user_puzzle_saves (user_id, sudoku_puzzle_id)
  where sudoku_puzzle_id is not null;
