'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Box,
  Building2,
  Clock,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  Archive,
  Zap,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccentConfig, TabKey } from '@/lib/types';

interface NavigationItem {
  key: TabKey;
  label: string;
  icon: React.ReactElement;
  href: string;
  description?: string;
  badge?: string;
}

interface DesktopSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: TabKey;
  accent: AccentConfig;
  onNewInvoice?: () => void;
  invoiceCount?: number;
}

const navigationItems: NavigationItem[] = [
  {
    key: 'invoice',
    label: 'Invoice',
    icon: <FileText className="w-5 h-5" />,
    href: '/invoice',
    description: 'Buat dan kelola invoice'
  },
  {
    key: 'products',
    label: 'Produk',
    icon: <Box className="w-5 h-5" />,
    href: '/products',
    description: 'Kelola katalog produk'
  },
  {
    key: 'company',
    label: 'Perusahaan',
    icon: <Building2 className="w-5 h-5" />,
    href: '/company',
    description: 'Info dan profil perusahaan'
  },
  {
    key: 'history',
    label: 'Riwayat',
    icon: <Clock className="w-5 h-5" />,
    href: '/history',
    description: 'Lihat riwayat invoice'
  },
  {
    key: 'settings',
    label: 'Pengaturan',
    icon: <SettingsIcon className="w-5 h-5" />,
    href: '/settings',
    description: 'Tema dan konfigurasi'
  }
];

export function DesktopSidebar({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  accent,
  onNewInvoice,
  invoiceCount = 0
}: DesktopSidebarProps) {
  return (
    <motion.div
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-30 flex flex-col shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="expanded-header"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <motion.div
                className={cn(
                  "h-10 w-10 rounded-xl grid place-items-center shadow-sm",
                  accent.solid
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <div className="font-semibold text-lg tracking-tight">ILoveInvoice</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Invoice Generator
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleCollapse}
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewInvoice}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white shadow-sm transition-all",
            accent.solid,
            accent.solidHover,
            !isCollapsed ? 'justify-start' : 'justify-center'
          )}
        >
          <Plus className="w-5 h-5 text-white flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium text-sm"
              >
                Invoice Baru
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.key;
          const showBadge = item.key === 'history' && invoiceCount > 0;
          
          return (
            <Link key={item.key} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative cursor-pointer",
                  !isCollapsed ? 'justify-start' : 'justify-center',
                  isActive
                    ? cn(accent.softBg, "shadow-sm border border-transparent")
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent"
                )}
              >
              <div className={cn(
                "flex-shrink-0",
                isActive ? accent.text : "text-neutral-600 dark:text-neutral-400"
              )}>
                {item.icon}
              </div>

              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 text-left overflow-hidden"
                  >
                    <div className={cn(
                      "font-medium text-sm",
                      isActive ? accent.text : "text-neutral-700 dark:text-neutral-300"
                    )}>
                      {item.label}
                    </div>
                    {item.description && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={cn("absolute right-2 w-1.5 h-8 rounded-full", accent.solid)}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Badge */}
              {showBadge && !isCollapsed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    accent.chip
                  )}
                >
                  {invoiceCount}
                </motion.div>
              )}
            </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Stats */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Total Invoice</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{invoiceCount}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Zap className="w-3 h-3" />
                <span>Auto-save aktif</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isCollapsed && (
          <div className="flex justify-center">
            <div className={cn(
              "w-8 h-8 rounded-lg grid place-items-center",
              "bg-neutral-100 dark:bg-neutral-800"
            )}>
              <BarChart3 className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
