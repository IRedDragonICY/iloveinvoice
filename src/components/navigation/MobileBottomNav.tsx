'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Box,
  Building2,
  Clock,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccentConfig, TabKey } from '@/lib/types';

interface MobileNavItem {
  key: TabKey;
  label: string;
  icon: React.ReactElement;
  href: string;
}

interface MobileBottomNavProps {
  activeTab: TabKey;
  accent: AccentConfig;
}

const mobileNavItems: MobileNavItem[] = [
  {
    key: 'invoice',
    label: 'Invoice',
    icon: <FileText className="w-5 h-5" />,
    href: '/invoice'
  },
  {
    key: 'products',
    label: 'Produk',
    icon: <Box className="w-5 h-5" />,
    href: '/products'
  },
  {
    key: 'company',
    label: 'Perusahaan',
    icon: <Building2 className="w-5 h-5" />,
    href: '/company'
  },
  {
    key: 'history',
    label: 'Riwayat',
    icon: <Clock className="w-5 h-5" />,
    href: '/history'
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <SettingsIcon className="w-5 h-5" />,
    href: '/settings'
  }
];

export function MobileBottomNav({ activeTab, accent }: MobileBottomNavProps) {
  return (
    <nav className="no-print fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-neutral-900/80 border-t border-neutral-200 dark:border-neutral-800 lg:hidden">
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between h-16">
          {mobileNavItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <Link key={item.key} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 relative cursor-pointer",
                    isActive ? "text-current" : "text-neutral-600 dark:text-neutral-400"
                  )}
                >
                <div className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  isActive ? cn(accent.softBg, accent.text) : ""
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? accent.text : "text-neutral-600 dark:text-neutral-400"
                )}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className={cn("absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full", accent.solid)}
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
