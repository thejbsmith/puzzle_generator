import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900">Authentication Failed</h1>
      <p className="text-zinc-500">Something went wrong signing you in. Please try again.</p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
