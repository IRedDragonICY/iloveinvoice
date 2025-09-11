'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/shared/Loading';
import { usePersistentState } from '@/hooks/usePersistentState';
import { STORAGE } from '@/lib/constants';
import { createNewInvoice } from '@/lib/invoice-utils';
import type { Invoice } from '@/lib/types';

export function NewInvoiceClient() {
  const router = useRouter();
  const [invoices, setInvoices] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [, setCurrentInvoiceId] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );

  useEffect(() => {
    // Create new invoice and redirect to its editor
    const newInvoice = createNewInvoice();
    setInvoices((prev) => [newInvoice, ...prev]);
    setCurrentInvoiceId(newInvoice.id);
    
    // Redirect to the new invoice
    router.replace(`/invoice/${newInvoice.id}`);
  }, [router, setInvoices, setCurrentInvoiceId]);

  return (
    <Loading 
      title="Membuat invoice baru..." 
      description="Sedang mempersiapkan editor invoice" 
    />
  );
}
