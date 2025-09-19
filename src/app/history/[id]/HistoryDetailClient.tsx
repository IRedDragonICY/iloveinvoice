'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3, Copy, Printer, Download } from 'lucide-react';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { Loading } from '@/components/shared/Loading';
import { Card } from '@/components/ui';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import { computeTotals, createNewInvoice } from '@/lib/invoice-utils';
import { exportInvoiceToPDF } from '@/services/pdf-service';
import { cn } from '@/lib/utils';
import type { Invoice, Settings, Company } from '@/lib/types';

interface HistoryDetailClientProps {
  invoiceId: string;
}

export function HistoryDetailClient({ invoiceId }: HistoryDetailClientProps) {
  const router = useRouter();
  const [settings] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [company] = usePersistentState<Company>(STORAGE.company, DEFAULTS.company);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [, setCurrentInvoiceId] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );
  
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const accent = ACCENT_MAP[settings.accent];
  const { navigateToInvoice } = useAppNavigation();

  function triggerToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => {
    if (invoiceId && invoices.length > 0) {
      const foundInvoice = invoices.find(inv => inv.id === invoiceId);
      
      if (foundInvoice) {
        setInvoice(foundInvoice);
        setIsLoading(false);
      } else {
        setNotFound(true);
        setIsLoading(false);
      }
    } else if (invoices.length === 0) {
      setIsLoading(true);
    } else {
      setNotFound(true);
      setIsLoading(false);
    }
  }, [invoiceId, invoices]);

  function duplicateInvoice(inv: Invoice) {
    const copy: Invoice = {
      ...createNewInvoice(),
      customer: { ...inv.customer },
      items: [...inv.items],
      notes: inv.notes,
      invoiceDiscountEnabled: inv.invoiceDiscountEnabled,
      invoiceDiscountType: inv.invoiceDiscountType,
      invoiceDiscountValue: inv.invoiceDiscountValue,
    };
    setInvoices((prev) => [copy, ...prev]);
    setCurrentInvoiceId(copy.id);
    navigateToInvoice(copy.id);
    triggerToast("Invoice diduplikasi");
  }

  async function exportInvoice(inv: Invoice, action: "save" | "print" = "save") {
    try {
      setExporting(true);
      
      // Create temporary div for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div class="w-[794px] bg-white text-neutral-900 p-6">
          <div id="invoice-content"></div>
        </div>
      `;
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-10000px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      const sourceNode = tempDiv.querySelector('#invoice-content') as HTMLElement;
      if (sourceNode) {
        await exportInvoiceToPDF(sourceNode, inv, company, action);
      }
      
      document.body.removeChild(tempDiv);
      setExporting(false);
      triggerToast(action === "save" ? "PDF berhasil dibuat" : "Membuka dialog print…");
    } catch (e) {
      console.error(e);
      setExporting(false);
      triggerToast("Gagal membuat PDF");
    }
  }

  if (isLoading) {
    return <Loading title="Loading invoice..." description="Sedang memuat invoice dari riwayat" />;
  }

  if (notFound || !invoice) {
    return (
      <PageWrapper>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">📋</div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Invoice tidak ditemukan
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Invoice dengan ID &quot;{invoiceId}&quot; tidak ada atau telah dihapus.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/history')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Kembali ke Riwayat
              </button>
              <button
                onClick={() => router.push('/invoice')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors"
              >
                Buat Invoice Baru
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const totals = computeTotals(invoice, settings);

  return (
    <PageWrapper>
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <div>
              <div className="text-sm font-medium">Invoice {invoice.number}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {invoice.customer.name || "Tanpa nama"} • {new Date(invoice.createdAt).toLocaleDateString('id-ID')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCurrentInvoiceId(invoice.id);
                navigateToInvoice(invoice.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </motion.button>
          </div>
        </div>
      </Card>

      {/* Invoice Preview */}
      <Card>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
          <InvoicePreview
            company={company}
            invoice={invoice}
            settings={settings}
            totals={totals}
          />
        </div>
      </Card>

      {/* Actions */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => duplicateInvoice(invoice)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Duplikat
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => exportInvoice(invoice, "print")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => exportInvoice(invoice, "save")}
            disabled={exporting}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-medium shadow-sm transition",
              accent.solid,
              accent.solidHover,
              exporting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting..." : "Download PDF"}
          </motion.button>
        </div>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 inset-x-0 z-50">
          <div className="mx-auto max-w-2xl px-4">
            <div className="px-4 py-2 rounded-full text-sm text-white shadow-lg bg-neutral-900/90 dark:bg-white/90 dark:text-neutral-900 w-fit mx-auto">
              {toast}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
