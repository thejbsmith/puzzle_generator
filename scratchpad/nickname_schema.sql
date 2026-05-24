-- Add optional user-set nickname to library saves
alter table user_puzzle_saves
  add column nickname text;
