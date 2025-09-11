'use client';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <ErrorBoundary 
      error={error} 
      reset={reset} 
      title="Oops! Something went wrong" 
    />
  );
}
