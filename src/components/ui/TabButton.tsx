import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AccentConfig } from '@/lib/types';

interface TabButtonProps {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent: AccentConfig;
}

export function TabButton({ active, icon, label, onClick, accent }: TabButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition",
        active ? cn(accent.softBg, "text-neutral-900 dark:text-white") : "text-neutral-500"
      )}
    >
      <div className="w-6 h-6 grid place-items-center">{icon}</div>
      <div className="text-[10px] leading-none">{label}</div>
    </motion.button>
  );
}

