'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceClient } from '../InvoiceClient';
import { Loading } from '@/components/shared/Loading';
import { usePersistentState } from '@/hooks/usePersistentState';
import { STORAGE } from '@/lib/constants';
import type { Invoice } from '@/lib/types';

interface InvoiceDetailClientProps {
  invoiceId: string;
}

export function InvoiceDetailClient({ invoiceId }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [invoices] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [, setCurrentInvoiceId] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      
      if (invoice) {
        // Set this invoice as current
        setCurrentInvoiceId(invoiceId);
        setIsLoading(false);
      } else {
        // Invoice not found
        setNotFound(true);
        setIsLoading(false);
      }
    } else if (invoices.length === 0) {
      // Still loading invoices
      setIsLoading(true);
    } else {
      // No invoiceId provided or invalid
      setNotFound(true);
      setIsLoading(false);
    }
  }, [invoiceId, invoices, setCurrentInvoiceId]);

  if (isLoading) {
    return <Loading title="Loading invoice..." description="Sedang memuat invoice" />;
  }

  if (notFound) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">📋</div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Invoice tidak ditemukan
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Invoice dengan ID "{invoiceId}" tidak ada atau telah dihapus.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/invoice')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Ke Invoice Editor
            </button>
            <button
              onClick={() => router.push('/history')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
            >
              Lihat Riwayat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the invoice editor with the selected invoice
  return <InvoiceClient />;
}
