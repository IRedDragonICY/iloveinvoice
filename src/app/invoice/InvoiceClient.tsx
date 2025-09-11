'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2, Phone, Mail, Pencil, Plus, Box, Trash2, ChevronDown, X, Loader2,
  Percent, DollarSign, Printer, Download
} from 'lucide-react';
import { Card, Row, TextField, TextArea, NumberField, MoneyField, Toggle } from '@/components/ui';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useDebounced } from '@/hooks/useDebounced';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import { cn, formatCurrency, parseNumber, clamp } from '@/lib/utils';
import { createNewInvoice, createBlankInvoiceItem, computeTotals } from '@/lib/invoice-utils';
import { exportInvoiceToPDF } from '@/services/pdf-service';
import { compressImage, formatFileSize, isValidImageFile, checkLocalStorageSpace } from '@/lib/image-utils';
import type {
  Company, Product, DiscountType, InvoiceItem, Customer, Invoice, Settings
} from '@/lib/types';

export function InvoiceClient() {
  const [settings] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [company] = usePersistentState<Company>(STORAGE.company, DEFAULTS.company);
  const [products] = usePersistentState<Product[]>(STORAGE.products, DEFAULTS.products);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [currentInvoiceId, setCurrentInvoiceId] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );

  const [productPickerForItem, setProductPickerForItem] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportTarget, setExportTarget] = useState<Invoice | null>(null);

  const accent = ACCENT_MAP[settings.accent];
  const pdfRef = useRef<HTMLDivElement>(null);
  const { navigateToTab } = useAppNavigation();

  // Ensure at least one invoice exists
  useEffect(() => {
    if (!currentInvoiceId || !invoices.find((i) => i.id === currentInvoiceId)) {
      const inv = createNewInvoice();
      setInvoices((prev) => [inv, ...prev]);
      setCurrentInvoiceId(inv.id);
    }
  }, [invoices, currentInvoiceId, setCurrentInvoiceId, setInvoices]);

  const currentInvoice = useMemo(
    () => invoices.find((i) => i.id === currentInvoiceId) || null,
    [invoices, currentInvoiceId]
  );

  function triggerToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // Helpers to update current invoice
  function updateInvoice(patch: Partial<Invoice>) {
    if (!currentInvoice) return;
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === currentInvoice.id ? { ...i, ...patch, updatedAt: Date.now() } : i
      )
    );
  }

  function updateCustomer<K extends keyof Customer>(key: K, value: Customer[K]) {
    if (!currentInvoice) return;
    updateInvoice({ customer: { ...currentInvoice.customer, [key]: value } });
  }

  function addItemFromProduct(itemId: string, product: Product) {
    if (!currentInvoice) return;
    const items = currentInvoice.items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            productId: product.id,
            name: product.name,
            description: product.description || "",
            price: product.price,
            discountEnabled: it.discountEnabled ?? false,
            discountType: it.discountType ?? "percent",
            discountValue: it.discountValue ?? 0,
          }
        : it
    );
    updateInvoice({ items });
  }

  function addBlankItem() {
    if (!currentInvoice) return;
    const newItem = createBlankInvoiceItem();
    updateInvoice({ items: [...currentInvoice.items, newItem] });
  }

  function removeItem(id: string) {
    if (!currentInvoice) return;
    updateInvoice({ items: currentInvoice.items.filter((i) => i.id !== id) });
  }

  function updateItem(id: string, patch: Partial<InvoiceItem>) {
    if (!currentInvoice) return;
    updateInvoice({
      items: currentInvoice.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }

  function newInvoice() {
    const inv = createNewInvoice();
    setInvoices((prev) => [inv, ...prev]);
    setCurrentInvoiceId(inv.id);
    setShowPreview(true);
    triggerToast("Invoice baru dibuat");
  }

  // Helper: add item and return its id (used by product picker)
  function addItemAndReturnId(): string | null {
    if (!currentInvoice) return null;
    const newItem = createBlankInvoiceItem();
    updateInvoice({ items: [...currentInvoice.items, newItem] });
    return newItem.id;
  }

  const totals = useMemo(() => {
    if (!currentInvoice) {
      return {
        subtotalBase: 0,
        itemDiscountTotal: 0,
        invoiceDiscount: 0,
        subtotalAfterItems: 0,
        taxable: 0,
        taxTotal: 0,
        total: 0,
      };
    }
    return computeTotals(currentInvoice, settings);
  }, [currentInvoice, settings]);

  // Decide whether to only show Total (no subtotals) when there is no discount and no tax
  const hasDiscount = totals.itemDiscountTotal > 0 || totals.invoiceDiscount > 0;
  const hasTax = settings.showTax && (settings.taxPercent || 0) > 0;
  const simpleTotalOnly = !hasDiscount && !hasTax;

  // PDF export/print
  async function exportInvoice(inv: Invoice, action: "save" | "print" = "save") {
    try {
      setExportTarget(inv);
      setExporting(true);
      // mount + paint hidden capture area
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      const sourceNode = pdfRef.current;
      if (!sourceNode) throw new Error("PDF source not ready");

      await exportInvoiceToPDF(sourceNode, inv, company, action);

      setExporting(false);
      setExportTarget(null);
      setTimeout(() => triggerToast(action === "save" ? "PDF berhasil dibuat" : "Membuka dialog print…"), 10);
    } catch (e) {
      console.error(e);
      setExporting(false);
      setExportTarget(null);
      triggerToast("Gagal membuat PDF");
    }
  }

  if (!currentInvoice) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-800 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-sm text-neutral-500">Loading invoice...</div>
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      {/* Invoice meta */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">No. Invoice</span>
            <input
              className="bg-transparent text-sm font-medium outline-none px-2 py-1 rounded-md border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 transition"
              value={currentInvoice.number}
              onChange={(e) => updateInvoice({ number: e.target.value })}
            />
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Disimpan: {new Date(currentInvoice.updatedAt).toLocaleString()}
          </div>
        </div>
      </Card>

      {/* Company and Customer */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <div className="max-w-[180px] max-h-14 rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-neutral-900 flex items-center justify-center p-1">
              {company.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoDataUrl}
                  alt="Logo"
                  className="max-h-12 w-auto object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-neutral-400" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 w-full">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Info Perusahaan
              </div>
              <div className="text-sm">
                <div className="font-medium">{company.name || "Nama Perusahaan"}</div>
                <div className="text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">{company.address || "Alamat perusahaan..."}</div>
                <div className="flex flex-col text-neutral-500 dark:text-neutral-400 mt-1">
                  {settings.showCompanyPhone && company.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {company.phone}
                    </span>
                  ) : null}
                  {settings.showCompanyEmail && company.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {company.email}
                    </span>
                  ) : null}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigateToTab("company")}
                className={cn(
                  "inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 transition",
                  accent.ring
                )}
              >
                <Pencil className="w-4 h-4" />
                Edit Perusahaan
              </motion.button>
            </div>

            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Pelanggan</div>
              <div className="grid grid-cols-1 gap-3">
                <TextField
                  label="Nama Pelanggan"
                  value={currentInvoice.customer.name}
                  onChange={(v) => updateCustomer("name", v)}
                />
                <TextArea
                  label="Alamat Pelanggan"
                  rows={2}
                  value={currentInvoice.customer.address || ""}
                  onChange={(v) => updateCustomer("address", v)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="No. Telp"
                    value={currentInvoice.customer.phone || ""}
                    onChange={(v) => updateCustomer("phone", v)}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={currentInvoice.customer.email || ""}
                    onChange={(v) => updateCustomer("email", v)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Item / Produk</div>
        </div>

        {currentInvoice.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-center space-y-3">
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Belum ada item di invoice.
            </div>
            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (products.length === 0) {
                    navigateToTab("products");
                  } else {
                    const itId = addItemAndReturnId();
                    if (itId) setProductPickerForItem(itId);
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm transition",
                  accent.solid,
                  accent.solidHover,
                  accent.ring
                )}
              >
                <Plus className="w-4 h-4 text-white" />
                Pilih dari Produk
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={addBlankItem}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-neutral-200 dark:border-neutral-800 transition"
              >
                <Plus className="w-4 h-4" />
                Tambah manual
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currentInvoice.items.map((it) => {
              const qty = clamp(it.quantity || 0, 0);
              const price = clamp(it.price || 0, 0);
              const base = qty * price;
              let disc = 0;
              if (it.discountEnabled && (it.discountValue || 0) > 0) {
                if ((it.discountType || "percent") === "amount") {
                  disc = clamp(it.discountValue || 0, 0, base);
                } else {
                  disc = clamp(((it.discountValue || 0) / 100) * base, 0, base);
                }
              }
              const lineTotal = clamp(base - disc, 0);

              return (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3"
                >
                  <div className="flex items-start gap-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (products.length === 0) navigateToTab("products");
                        else setProductPickerForItem(it.id);
                      }}
                      className={cn(
                        "shrink-0 h-10 w-10 rounded-xl grid place-items-center border border-neutral-200 dark:border-neutral-800",
                        products.length ? (settings.accent === "neutral" ? "bg-neutral-100 dark:bg-neutral-900" : accent.softBg) : "bg-neutral-100 dark:bg-neutral-900"
                      )}
                      title="Pilih produk"
                    >
                      <Box className={cn("w-5 h-5", accent.text)} />
                    </motion.button>
                    <div className="w-full space-y-2">
                      <TextField
                        label="Nama Produk"
                        value={it.name}
                        onChange={(v) => updateItem(it.id, { name: v })}
                      />
                      <TextArea
                        label="Deskripsi"
                        rows={2}
                        value={it.description || ""}
                        onChange={(v) => updateItem(it.id, { description: v })}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <NumberField
                          label="Qty"
                          value={String(it.quantity ?? 0)}
                          onChange={(v) => updateItem(it.id, { quantity: parseNumber(v) })}
                        />
                        <MoneyField
                          label="Harga"
                          currency={settings.currency}
                          value={it.price || 0}
                          onChange={(value) => updateItem(it.id, { price: value })}
                        />
                        <div className="hidden sm:block" />
                      </div>

                      {/* Item Discount */}
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            <span>Diskon Item</span>
                          </div>
                          <Toggle
                            checked={!!it.discountEnabled}
                            onChange={(val) => updateItem(it.id, { discountEnabled: val })}
                          />
                        </div>
                        {it.discountEnabled ? (
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Tipe</div>
                              <div className="relative">
                                <select
                                  value={it.discountType || "percent"}
                                  onChange={(e) => updateItem(it.id, { discountType: e.target.value as DiscountType })}
                                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 pr-8 pl-9 py-2 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5 appearance-none"
                                >
                                  <option value="percent">Persen</option>
                                  <option value="amount">Nominal</option>
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                                  {(it.discountType || "percent") === "percent" ? (
                                    <Percent className="w-4 h-4" />
                                  ) : (
                                    <DollarSign className="w-4 h-4" />
                                  )}
                                </div>
                                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                              </div>
                            </label>
                            <label className="block">
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">Nilai</div>
                              <input
                                inputMode="decimal"
                                type="text"
                                value={String(it.discountValue ?? 0)}
                                onChange={(e) => updateItem(it.id, { discountValue: parseNumber(e.target.value) })}
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
                                placeholder={(it.discountType || "percent") === "percent" ? "0%" : "0"}
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Off secara default. Aktifkan untuk memberi diskon pada item ini.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {it.productId ? "Ditarik dari produk" : "Manual"}
                        </div>
                        <div className="flex items-center gap-3">
                          {disc > 0 ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                              − {formatCurrency(disc, settings.currency)}
                            </span>
                          ) : null}
                          <div className="text-sm font-medium">
                            {formatCurrency(lineTotal, settings.currency)}
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeItem(it.id)}
                            className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800 transition"
                            title="Hapus item"
                          >
                            <Trash2 className="w-4 h-4 text-neutral-500" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="flex items-center justify-between pt-1">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (products.length === 0) navigateToTab("products");
                  else {
                    const itId = addItemAndReturnId();
                    if (itId) setProductPickerForItem(itId);
                  }
                }}
                className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
              >
                <Plus className="w-4 h-4" />
                Tambah dari Produk
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={addBlankItem}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm transition",
                  accent.solid,
                  accent.solidHover,
                  accent.ring
                )}
              >
                <Plus className="w-4 h-4 text-white" />
                Item Manual
              </motion.button>
            </div>
          </div>
        )}
      </Card>

      {/* Notes */}
      <Card>
        <TextArea
          label="Pesan / Catatan di Invoice"
          rows={3}
          value={currentInvoice.notes || ""}
          onChange={(v) => updateInvoice({ notes: v })}
        />
      </Card>

      {/* Totals + Invoice-level Discount */}
      <Card>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Diskon Invoice</div>
            <Toggle
              checked={!!currentInvoice.invoiceDiscountEnabled}
              onChange={(v) =>
                updateInvoice({ invoiceDiscountEnabled: v })
              }
            />
          </div>
          {currentInvoice.invoiceDiscountEnabled ? (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="block">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tipe Diskon</div>
                <div className="relative">
                  <select
                    value={currentInvoice.invoiceDiscountType || "percent"}
                    onChange={(e) =>
                      updateInvoice({ invoiceDiscountType: e.target.value as DiscountType })
                    }
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 pr-8 pl-9 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5 appearance-none"
                  >
                    <option value="percent">Persen</option>
                    <option value="amount">Nominal</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    {(currentInvoice.invoiceDiscountType || "percent") === "percent" ? (
                      <Percent className="w-4 h-4" />
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
              </label>
              <label className="block">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Nilai Diskon</div>
                <input
                  inputMode="decimal"
                  type="text"
                  value={String(currentInvoice.invoiceDiscountValue ?? 0)}
                  onChange={(e) =>
                    updateInvoice({ invoiceDiscountValue: parseNumber(e.target.value) })
                  }
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
                  placeholder={(currentInvoice.invoiceDiscountType || "percent") === "percent" ? "0%" : "0"}
                />
              </label>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              Off secara default. Aktifkan untuk memberikan diskon keseluruhan.
            </div>
          )}
        </div>

        {/* Show only Total if no discounts AND no tax */}
        <div className="space-y-2 mt-3">
          {simpleTotalOnly ? (
            <Row
              label="Total"
              value={formatCurrency(totals.total, settings.currency)}
              strong
            />
          ) : (
            <>
              <Row label="Subtotal awal" value={formatCurrency(totals.subtotalBase, settings.currency)} />
              {totals.itemDiscountTotal > 0 ? (
                <Row label="Diskon item" value={`− ${formatCurrency(totals.itemDiscountTotal, settings.currency)}`} />
              ) : null}
              {(totals.itemDiscountTotal > 0 || currentInvoice.invoiceDiscountEnabled) ? (
                <Row label="Subtotal setelah diskon item" value={formatCurrency(totals.subtotalAfterItems, settings.currency)} />
              ) : null}
              {totals.invoiceDiscount > 0 ? (
                <Row label="Diskon invoice" value={`− ${formatCurrency(totals.invoiceDiscount, settings.currency)}`} />
              ) : null}
              <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
              <Row label="Subtotal" value={formatCurrency(totals.taxable, settings.currency)} />
              {settings.showTax ? (
                <Row label={`Pajak (${settings.taxPercent || 0}%)`} value={formatCurrency(totals.taxTotal, settings.currency)} />
              ) : null}
              <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
              <Row
                label="Total"
                value={formatCurrency(totals.total, settings.currency)}
                strong
              />
            </>
          )}
        </div>
      </Card>

      {/* Preview + Export */}
      <Card className="no-print">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPreview((v) => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="text-sm font-medium">Preview</div>
          <ChevronDown
            className={cn(
              "w-5 h-5 transition",
              showPreview ? "rotate-180" : ""
            )}
          />
        </motion.button>
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            showPreview ? "mt-4 max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <InvoicePreview
              company={company}
              invoice={currentInvoice}
              settings={settings}
              totals={totals}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={newInvoice}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-neutral-200 dark:border-neutral-800"
          >
            <Plus className="w-4 h-4" />
            Invoice Baru
          </motion.button>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => exportInvoice(currentInvoice, "print")}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm border border-neutral-200 dark:border-neutral-800"
              )}
            >
              <Printer className="w-4 h-4" />
              Print
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => exportInvoice(currentInvoice, "save")}
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
        </div>
      </Card>

      {/* Product Picker Bottom Sheet (animated) */}
      <AnimatePresence>
        {productPickerForItem ? (
          <div className="no-print fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setProductPickerForItem(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mx-auto max-w-2xl px-4 pb-4">
                <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="text-sm font-medium">Pilih Produk</div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProductPickerForItem(null)}
                      className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                    {products.length === 0 ? (
                      <div className="p-4 text-sm text-neutral-600 dark:text-neutral-300">
                        Belum ada produk. Tambahkan produk terlebih dahulu.
                        <div className="mt-3">
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setProductPickerForItem(null);
                              navigateToTab("products");
                            }}
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm transition",
                              accent.solid,
                              accent.solidHover
                            )}
                          >
                            <Plus className="w-4 h-4 text-white" />
                            Ke menu Produk
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            addItemFromProduct(productPickerForItem!, p);
                            setProductPickerForItem(null);
                          }}
                          className="w-full text-left p-4 active:bg-neutral-50 dark:active:bg-neutral-800"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                {p.description}
                              </div>
                            </div>
                            <div className="text-sm">
                              {formatCurrency(p.price, settings.currency)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Hidden offscreen PDF area */}
      {exporting ? (
        <div
          aria-hidden
          className="fixed -left-[10000px] top-0 pointer-events-none"
          ref={pdfRef}
        >
          <div className="w-[794px] bg-white text-neutral-900">
            <div className="p-6">
              <InvoicePreview
                company={company}
                invoice={exportTarget ?? currentInvoice}
                settings={settings}
                totals={computeTotals(exportTarget ?? currentInvoice, settings)}
                printing
              />
            </div>
          </div>
        </div>
      ) : null}

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

      {/* Exporting overlay */}
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
              <Loader2 className={cn("w-5 h-5 animate-spin", settings.accent === "neutral" ? "text-neutral-900 dark:text-white" : accent.text)} />
              <div className="text-sm font-medium">Membangun PDF…</div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PageWrapper>
  );
}
