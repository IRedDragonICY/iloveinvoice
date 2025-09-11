'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Root page - redirects to invoice editor
 */

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to invoice page on mount
    router.replace('/invoice');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-800 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-sm text-neutral-500 dark:text-neutral-400">Redirecting...</div>
      </div>
    </div>
  );
}