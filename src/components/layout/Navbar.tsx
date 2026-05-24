'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function userAvatarUrl(user: User): string {
  // Google OAuth provides a real profile photo in user_metadata
  if (user.user_metadata?.avatar_url) return user.user_metadata.avatar_url as string;
  // Fallback: deterministic identicon from email via DiceBear
  const seed = encodeURIComponent((user.email ?? user.id).toLowerCase());
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}&backgroundColor=18181b&size=80`;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' },
    });

  const signOut = () => supabase.auth.signOut();

  const initials = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
          Puzzle Generator
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/library" className="text-sm text-zinc-600 hover:text-zinc-900">
                My Library
              </Link>
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatarUrl(user)} alt={user.email ?? 'User avatar'} />
                <AvatarFallback className="bg-zinc-800 text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={signIn}>
              Sign in with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
