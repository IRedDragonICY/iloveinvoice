'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function ErrorBoundary({ 
  error, 
  reset, 
  title = 'Something went wrong!' 
}: ErrorBoundaryProps) {
  const router = useRouter();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/invoice')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </motion.button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-800 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </motion.div>
    </div>
  );
}
