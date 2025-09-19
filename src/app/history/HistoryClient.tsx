'use client';

import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, Plus, Search, Filter, SortDesc, Receipt, User, Calendar, Banknote,
  Eye, Edit3, Copy, Printer, Download, Trash2, X
} from 'lucide-react';
import { Card } from '@/components/ui';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useDebounced } from '@/hooks/useDebounced';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import { computeTotals, createNewInvoice } from '@/lib/invoice-utils';
import { formatCurrency, cn } from '@/lib/utils';
import { exportInvoiceToPDF } from '@/services/pdf-service';
import type { Invoice, Settings, Company } from '@/lib/types';

export function HistoryClient() {
  const [settings] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [company] = usePersistentState<Company>(STORAGE.company, DEFAULTS.company);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [currentInvoiceId, setCurrentInvoiceId] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );
  
  const [historyQuery, setHistoryQuery] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportTarget, setExportTarget] = useState<Invoice | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  
  const debouncedHistoryQuery = useDebounced(historyQuery, 200);
  const accent = ACCENT_MAP[settings.accent];
  const { navigateToInvoice, navigateToNewInvoice, navigateToHistoryItem } = useAppNavigation();

  function triggerToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const filteredInvoices = useMemo(() => {
    const q = debouncedHistoryQuery.trim().toLowerCase();
    let list = [...invoices];
    if (q) {
      list = list.filter(
        (inv) =>
          inv.number.toLowerCase().includes(q) ||
          (inv.customer.name || "").toLowerCase().includes(q) ||
          (inv.notes || "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [invoices, debouncedHistoryQuery]);

  const allSelectedOnPage = filteredInvoices.length > 0 && filteredInvoices.every((inv) => selectedIds.has(inv.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        filteredInvoices.forEach((inv) => next.delete(inv.id));
      } else {
        filteredInvoices.forEach((inv) => next.add(inv.id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

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

  function deleteInvoice(id: string) {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    if (currentInvoiceId === id) {
      const next = invoices.find((i) => i.id !== id);
      if (next) {
        setCurrentInvoiceId(next.id);
      } else {
        const inv = createNewInvoice();
        setInvoices((prev) => [inv, ...prev]);
        setCurrentInvoiceId(inv.id);
      }
    }
    triggerToast("Invoice dihapus");
  }

  function deleteInvoicesBatch(ids: string[]) {
    if (ids.length === 0) return;
    setInvoices((prev) => prev.filter((i) => !ids.includes(i.id)));
    if (ids.includes(currentInvoiceId || "")) {
      const remaining = invoices.filter((i) => !ids.includes(i.id));
      if (remaining.length > 0) {
        setCurrentInvoiceId(remaining[0].id);
      } else {
        const inv = createNewInvoice();
        setInvoices((prev) => [inv, ...prev]);
        setCurrentInvoiceId(inv.id);
      }
    }
    setSelectedIds(new Set());
    triggerToast(`${ids.length} invoice dihapus`);
  }

  function newInvoice() {
    const inv = createNewInvoice();
    setInvoices((prev) => [inv, ...prev]);
    setCurrentInvoiceId(inv.id);
    navigateToNewInvoice();
    triggerToast("Invoice baru dibuat");
  }

  async function exportInvoice(inv: Invoice, action: "save" | "print" = "save") {
    try {
      setExportTarget(inv);
      setExporting(true);
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const sourceNode = pdfRef.current;
      if (!sourceNode) throw new Error('PDF source not ready');
      await exportInvoiceToPDF(sourceNode, inv, company, action);
      setExporting(false);
      setExportTarget(null);
      triggerToast(action === "save" ? "PDF berhasil dibuat" : "Membuka dialog print…");
    } catch (e) {
      console.error(e);
      setExporting(false);
      setExportTarget(null);
      triggerToast("Gagal membuat PDF");
    }
  }

  async function exportInvoicesBatch(ids: string[], action: "save" | "print" = "save") {
    const list = invoices.filter((i) => ids.includes(i.id));
    if (list.length === 0) return;
    try {
      setExporting(true);
      for (const inv of list) {
        setExportTarget(inv);
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        const sourceNode = pdfRef.current;
        if (!sourceNode) throw new Error('PDF source not ready');
        await exportInvoiceToPDF(sourceNode, inv, company, action);
      }
      setExporting(false);
      setExportTarget(null);
      triggerToast(`${list.length} PDF berhasil dibuat`);
    } catch (e) {
      console.error(e);
      setExporting(false);
      setExportTarget(null);
      triggerToast("Gagal membuat PDF");
    }
  }

  return (
    <PageWrapper>
      {/* Header with Stats */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", settings.accent === "neutral" ? "bg-neutral-100 dark:bg-neutral-800" : accent.softBg)}>
              <Archive className={cn("w-5 h-5", accent.text)} />
            </div>
            <div>
              <div className="text-sm font-medium">Riwayat Invoice</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {invoices.length} invoice • {filteredInvoices.length} ditampilkan
              </div>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={newInvoice}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm transition",
              accent.solid,
              accent.solidHover,
              accent.ring
            )}
          >
            <Plus className="w-4 h-4 text-white" />
            Invoice Baru
          </motion.button>
        </div>
      </Card>

      {/* Search and Filter */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Cari invoice (no, pelanggan, catatan)…"
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
              title="Urutkan"
            >
              <SortDesc className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </Card>

      {/* Invoice List */}
      <Card>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-8">
            <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-7 h-7 text-neutral-400" />
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">
              Tidak ada invoice yang ditemukan
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Coba ubah kata kunci pencarian Anda
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bulk actions */}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={toggleSelectAllOnPage}
                  className="rounded border-neutral-300 dark:border-neutral-700"
                />
                Pilih semua
                {selectedIds.size > 0 ? (
                  <span className="text-xs text-neutral-500">({selectedIds.size} dipilih)</span>
                ) : null}
              </label>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={selectedIds.size === 0}
                  onClick={() => exportInvoicesBatch(Array.from(selectedIds), "save")}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs border transition-colors",
                    selectedIds.size === 0
                      ? "border-neutral-200 dark:border-neutral-800 text-neutral-400"
                      : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  Export PDF
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={selectedIds.size === 0}
                  onClick={() => {
                    if (selectedIds.size === 0) return;
                    if (window.confirm(`Hapus ${selectedIds.size} invoice terpilih?`)) {
                      deleteInvoicesBatch(Array.from(selectedIds));
                    }
                  }}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs border transition-colors",
                    selectedIds.size === 0
                      ? "border-neutral-200 dark:border-neutral-800 text-neutral-400"
                      : "border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                  )}
                >
                  Hapus
                </motion.button>
                {selectedIds.size > 0 ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clearSelection}
                    className="px-3 py-2 rounded-lg text-xs border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Bersihkan
                  </motion.button>
                ) : null}
              </div>
            </div>
            {filteredInvoices.map((inv) => {
              const invoiceTotals = computeTotals(inv, settings);
              const isRecent = (Date.now() - inv.updatedAt) < 24 * 60 * 60 * 1000; // 24 hours
              const isCurrent = inv.id === currentInvoiceId;
              
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-200 relative",
                    isCurrent && "ring-2 ring-black/5 dark:ring-white/10"
                  )}
                >
                  {isCurrent ? (
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl", accent.solid)} />
                  ) : null}
                  <div className="space-y-3">
                    {/* Invoice Header Info */}
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(inv.id)}
                          onChange={() => toggleSelect(inv.id)}
                          className="rounded border-neutral-300 dark:border-neutral-700"
                          aria-label="Pilih invoice"
                        />
                      </div>
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-xl grid place-items-center border transition-colors",
                        (isCurrent || isRecent)
                          ? cn(accent.softBg, "border-transparent")
                          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                      )}>
                        <Receipt className={cn("w-5 h-5", (isCurrent || isRecent) ? accent.text : "text-neutral-400")} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {inv.number}
                          </div>
                          {isRecent && (
                            <span className={cn(
                              "px-2 py-0.5 text-[10px] font-medium rounded-full",
                              accent.chip
                            )}>
                              Baru
                            </span>
                          )}
                          {isCurrent && (
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full",
                              accent.chip
                            )}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                              Sedang diedit
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{inv.customer.name || "Tanpa nama"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{new Date(inv.createdAt).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}</span>
                            <span className="text-neutral-400">•</span>
                            <span>{new Date(inv.updatedAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Banknote className="w-3 h-3 flex-shrink-0" />
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {formatCurrency(invoiceTotals.total, settings.currency)}
                            </span>
                            <span className="text-neutral-400">•</span>
                            <span>{inv.items.length} item</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions - Mobile Optimized */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      {/* Primary Actions Row */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigateToHistoryItem(inv.id)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            accent.solid,
                            "text-white"
                          )}
                        >
                          <Eye className="w-4 h-4" />
                          Lihat
                        </motion.button>
                        
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setCurrentInvoiceId(inv.id);
                            navigateToInvoice(inv.id);
                          }}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                            isCurrent
                              ? cn(accent.softBg, "border-transparent")
                              : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                            accent.ring
                          )}
                          aria-current={isCurrent ? "true" : undefined}
                        >
                          <Edit3 className="w-4 h-4" />
                          {isCurrent ? "Sedang Diedit" : "Edit"}
                        </motion.button>
                      </div>

                      {/* Secondary Actions Row */}
                      <div className="flex items-center justify-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => duplicateInvoice(inv)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Duplikat</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => exportInvoice(inv, "print")}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Print</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => exportInvoice(inv, "save")}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">PDF</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteInvoice(inv.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 transition-colors text-xs font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewInvoice ? (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setPreviewInvoice(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[85vh]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mx-auto max-w-2xl px-4 pb-4">
                <div className="rounded-t-2xl bg-white dark:bg-neutral-900 border border-b-0 border-black/5 dark:border-white/10 shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", accent.softBg)}>
                        <Eye className={cn("w-5 h-5", accent.text)} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Preview Invoice</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {previewInvoice.number} • {previewInvoice.customer.name || "Tanpa nama"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentInvoiceId(previewInvoice.id);
                          navigateToInvoice(previewInvoice.id);
                          setPreviewInvoice(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPreviewInvoice(null)}
                        className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Preview Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
                        <InvoicePreview
                          company={company}
                          invoice={previewInvoice}
                          settings={settings}
                          totals={computeTotals(previewInvoice, settings)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-between gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => duplicateInvoice(previewInvoice)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplikat
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => exportInvoice(previewInvoice, "print")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-medium transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </motion.button>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        exportInvoice(previewInvoice, "save");
                        setPreviewInvoice(null);
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-medium shadow-sm transition",
                        accent.solid,
                        accent.solidHover
                      )}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

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

      {/* Loading overlay for exporting */}
      <AnimatePresence>
        {exporting ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 px-4 py-3 flex items-center gap-3"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-sm font-medium">Membangun PDF…</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageWrapper>
  );
}
