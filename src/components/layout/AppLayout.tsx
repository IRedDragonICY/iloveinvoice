'use client';

import { motion } from 'framer-motion';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import type { AccentConfig } from '@/lib/types';

interface AppLayoutProps {
  children: React.ReactNode;
  accent: AccentConfig;
  onNewInvoice?: () => void;
  onExportPDF?: () => void;
  showExportButton?: boolean;
  invoiceCount?: number;
}

export function AppLayout({
  children,
  accent,
  onNewInvoice,
  onExportPDF,
  showExportButton = false,
  invoiceCount = 0
}: AppLayoutProps) {
  const { isSidebarCollapsed, toggleSidebar, isMobile } = useNavigation();
  const { activeTab } = useAppNavigation();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <DesktopSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          activeTab={activeTab}
          accent={accent}
          onNewInvoice={onNewInvoice}
          invoiceCount={invoiceCount}
        />
      )}

      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          activeTab={activeTab}
          accent={accent}
          onExportPDF={onExportPDF}
          showExportButton={showExportButton}
        />
      )}

      {/* Main Content */}
      <motion.main
        animate={{
          marginLeft: !isMobile ? (isSidebarCollapsed ? 80 : 280) : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          min-h-screen
          ${isMobile ? 'pt-16 pb-20' : 'p-6'}
        `}
      >
        <div className={`
          ${isMobile ? 'mx-auto max-w-2xl px-4' : 'max-w-6xl mx-auto'}
        `}>
          {children}
        </div>
      </motion.main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeTab={activeTab}
          accent={accent}
        />
      )}

      {/* Desktop Overlay for collapsed sidebar hover */}
      {!isMobile && isSidebarCollapsed && (
        <motion.div
          className="fixed inset-0 bg-black/20 z-20 opacity-0 pointer-events-none"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </div>
  );
}
