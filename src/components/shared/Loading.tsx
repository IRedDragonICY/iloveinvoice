'use client';

import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';

interface LoadingProps {
  title?: string;
  description?: string;
}

export function Loading({ title = 'Loading...', description }: LoadingProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-neutral-200 dark:border-neutral-800 border-t-blue-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {title}
          </div>
          {description && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6"></div>
      </div>
      <div className="space-y-2">
        <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
      </div>
    </div>
  );
}
