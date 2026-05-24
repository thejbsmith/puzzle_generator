You are setting up Supabase client infrastructure and the database schema for the puzzle_generator Next.js app at /Users/thejbsmith/workspace/thejbsmith/puzzle_generator.

Create these files:

FILE 1: src/lib/supabase/server.ts
```
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component context — can be ignored if using middleware
          }
        },
      },
    }
  );
}
```

FILE 2: src/lib/supabase/client.ts
```
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

FILE 3: src/app/auth/callback/route.ts
```
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
```

FILE 4: src/middleware.ts
Use the @supabase/ssr updateSession pattern to refresh the auth token on every request:
```
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

DATABASE SETUP:
Connect to the Supabase database and run the schema SQL. The connection details are:
- Host: db.johrmzaetkchoficsqkh.supabase.co
- Port: 5432
- Database: postgres
- User: postgres
- Password: KjwhznmVC1HSKl5A

Run this SQL using psql. Check if psql is available first. If not, try to use the Supabase CLI (npx supabase) with the db push command. If neither works, write the SQL to a file scratchpad/schema.sql and note that the user needs to run it manually.

SQL to run:
```sql
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
    create policy "authenticated users can create puzzles" on puzzles for insert with check (auth.uid() = created_by);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_puzzle_saves' and policyname = 'users own their saves') then
    create policy "users own their saves" on user_puzzle_saves using (auth.uid() = user_id);
  end if;
end $$;
```

When done, save a summary to scratchpad/agent-c-done.md describing what files you created and whether the DB schema was applied successfully.
