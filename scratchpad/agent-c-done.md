# Agent C — Supabase Infrastructure Setup

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | Server-side Supabase client using `@supabase/ssr` + Next.js `cookies()` |
| `src/lib/supabase/client.ts` | Browser-side Supabase client using `@supabase/ssr` |
| `src/app/auth/callback/route.ts` | OAuth callback route — exchanges code for session, redirects to `/` |
| `src/middleware.ts` | Token refresh middleware on every request via `updateSession` pattern |

## Database Schema

**Status: NOT applied — DNS resolution failed for `db.johrmzaetkchoficsqkh.supabase.co`**

The schema SQL has been written to `scratchpad/schema.sql`. To apply it manually, run:

```bash
PGPASSWORD='KjwhznmVC1HSKl5A' psql \
  -h db.johrmzaetkchoficsqkh.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f scratchpad/schema.sql
```

Alternatively, paste the contents of `scratchpad/schema.sql` into the Supabase SQL Editor at:
https://supabase.com/dashboard/project/johrmzaetkchoficsqkh/sql

### Schema summary
- `puzzles` table: stores generated puzzles with RLS enabled
  - Public read, authenticated insert (own rows only)
- `user_puzzle_saves` table: per-user progress/saves with RLS enabled
  - Users own their rows (full access to their own saves only)
