'use client';

import { AppLayout } from './AppLayout';
import { AccentPresence } from '@/components/AccentPresence';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useTheme } from '@/hooks/useTheme';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import { createNewInvoice } from '@/lib/invoice-utils';
import type { Settings, Invoice } from '@/lib/types';
import { useAppNavigation } from '@/hooks/useAppNavigation';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const [settings] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [, setCurrentInvoiceId] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );
  
  // Apply theme using custom hook
  useTheme(settings);
  
  const accent = ACCENT_MAP[settings.accent];
  const { navigateToNewInvoice, activeTab } = useAppNavigation();
  
  const handleNewInvoice = () => {
    const inv = createNewInvoice();
    setInvoices((prev) => [inv, ...prev]);
    setCurrentInvoiceId(inv.id);
    navigateToNewInvoice();
  };
  
  const showExportButton = activeTab === 'invoice';
  
  return (
    <>
      <AccentPresence />
      <AppLayout
        accent={accent}
        onNewInvoice={handleNewInvoice}
        showExportButton={showExportButton}
        invoiceCount={invoices.length}
      >
        {children}
      </AppLayout>
    </>
  );
}
