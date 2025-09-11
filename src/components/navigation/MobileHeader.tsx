'use client';

import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccentConfig, TabKey } from '@/lib/types';

interface MobileHeaderProps {
  activeTab: TabKey;
  accent: AccentConfig;
  onExportPDF?: () => void;
  showExportButton?: boolean;
}

const tabTitles: Record<TabKey, { title: string; subtitle: string }> = {
  invoice: { title: 'ILoveInvoice', subtitle: 'Generator invoice • auto-save' },
  products: { title: 'ILoveInvoice', subtitle: 'Produk' },
  company: { title: 'ILoveInvoice', subtitle: 'Perusahaan' },
  history: { title: 'ILoveInvoice', subtitle: 'Riwayat' },
  settings: { title: 'ILoveInvoice', subtitle: 'Pengaturan' }
};

export function MobileHeader({ 
  activeTab, 
  accent, 
  onExportPDF, 
  showExportButton = false 
}: MobileHeaderProps) {
  const { title, subtitle } = tabTitles[activeTab];

  return (
    <header className="no-print fixed top-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 lg:hidden">
      <div className="mx-auto max-w-2xl px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "h-9 w-9 rounded-xl grid place-items-center shadow-sm",
                accent.solid
              )}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <FileText className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex flex-col leading-tight">
              <div className="font-semibold tracking-tight">{title}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </div>
            </div>
          </div>
          
          {showExportButton && onExportPDF && (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onExportPDF}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm transition",
                  accent.solid,
                  accent.solidHover,
                  accent.ring
                )}
              >
                <Download className="w-4 h-4 text-white" />
                Export PDF
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
