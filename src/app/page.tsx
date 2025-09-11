'use client';
import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Download,
  Building2,
  Phone,
  Mail,
  Pencil,
  Plus,
  Box,
  Trash2,
  ChevronDown,
  X,
  Loader2,
  Clock,
  Settings as SettingsIcon,
  Check,
  Search,
  Printer,
  Percent,
  DollarSign,
  Edit3,
  Copy,
  Calendar,
  User,
  Receipt,
  Archive,
  Filter,
  SortDesc,
  Eye,
  Banknote
} from "lucide-react";

// Modular imports
import type {
  ThemeMode,
  AccentKey,
  Company,
  Product,
  DiscountType,
  InvoiceItem,
  Customer,
  Invoice,
  Settings,
  TabKey
} from '@/lib/types';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import { cn, formatCurrency, parseNumber, clamp } from '@/lib/utils';
import { createNewInvoice, createBlankInvoiceItem, computeTotals } from '@/lib/invoice-utils';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useDebounced } from '@/hooks/useDebounced';
import { useTheme } from '@/hooks/useTheme';
import { exportInvoiceToPDF } from '@/services/pdf-service';
import { compressImage, formatFileSize, isValidImageFile, checkLocalStorageSpace } from '@/lib/image-utils';
import {
  Card,
  Row,
  TextField,
  TextArea,
  NumberField,
  MoneyField,
  SelectField,
  Toggle,
  TabButton
} from '@/components/ui';
import { ProductEditor } from '@/components/product/ProductEditor';
import { ProductRow } from '@/components/product/ProductRow';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { AccentPresence } from '@/components/AccentPresence';

/**
 * ILoveInvoice — mobile-first invoice generator
 * - Next.js + Tailwind CSS
 * - LocalStorage persistence (company, products, invoices, settings)
 * - Invoice history with search + print
 * - Invoice-level and item-level discounts (off by default)
 * - Invoice-level tax (not per-item)
 * - Export to PDF via jsPDF + html2canvas-pro (multi-page, crisp, better UX)
 * - Custom invoice footer
 * - Bottom navigation, light/dark mode, animations
 */

export default function ILoveInvoice() {
  const [settings, setSettings, settingsReady, settingsError] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [company, setCompany, companyReady, companyError] = usePersistentState<Company>(STORAGE.company, DEFAULTS.company);
  const [products, setProducts, productsReady, productsError] = usePersistentState<Product[]>(STORAGE.products, DEFAULTS.products);
  const [invoices, setInvoices, invoicesReady, invoicesError] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [currentInvoiceId, setCurrentInvoiceId, currentIdReady, currentIdError] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );

  // state management
  const [activeTab, setActiveTab] = useState<TabKey>("invoice");
  const [productPickerForItem, setProductPickerForItem] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportTarget, setExportTarget] = useState<Invoice | null>(null);
  
  // Image upload states
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // History preview modal states
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const [productQuery, setProductQuery] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const debouncedProductQuery = useDebounced(productQuery, 200);
  const debouncedHistoryQuery = useDebounced(historyQuery, 200);

  const hydrated = settingsReady && companyReady && productsReady && invoicesReady && currentIdReady;

  // Apply theme using custom hook
  useTheme(settings);

  // Monitor localStorage errors and show user feedback
  useEffect(() => {
    if (settingsError) {
      triggerToast(`Pengaturan: ${settingsError.message}`);
    }
  }, [settingsError]);

  useEffect(() => {
    if (productsError) {
      triggerToast(`Produk: ${productsError.message}`);
    }
  }, [productsError]);

  useEffect(() => {
    if (invoicesError) {
      triggerToast(`Invoice: ${invoicesError.message}`);
    }
  }, [invoicesError]);

  // Show general storage warning if any critical error occurs
  useEffect(() => {
    const hasQuotaError = [settingsError, companyError, productsError, invoicesError, currentIdError]
      .some(error => error?.type === 'quota_exceeded');
    
    if (hasQuotaError) {
      triggerToast('Storage hampir penuh! Pertimbangkan untuk menghapus data lama atau gambar besar.');
    }
  }, [settingsError, companyError, productsError, invoicesError, currentIdError]);

  // Close preview modal when switching tabs
  useEffect(() => {
    if (activeTab !== "history" && previewInvoice) {
      setPreviewInvoice(null);
    }
  }, [activeTab, previewInvoice]);

  // ensure at least one invoice exists
  useEffect(() => {
    if (!hydrated) return;
    if (!currentInvoiceId || !invoices.find((i) => i.id === currentInvoiceId)) {
      const inv = createNewInvoice();
      setInvoices((prev) => [inv, ...prev]);
      setCurrentInvoiceId(inv.id);
    }
  }, [hydrated, invoices, currentInvoiceId, setCurrentInvoiceId, setInvoices]);

  const currentInvoice = useMemo(
    () => invoices.find((i) => i.id === currentInvoiceId) || null,
    [invoices, currentInvoiceId]
  );

  const accent = ACCENT_MAP[settings.accent];

  // helpers to update current invoice
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
    setActiveTab("invoice");
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

  function newInvoice() {
    const inv = createNewInvoice();
    setInvoices((prev) => [inv, ...prev]);
    setCurrentInvoiceId(inv.id);
    setActiveTab("invoice");
    setShowPreview(true);
    triggerToast("Invoice baru dibuat");
  }

  function triggerToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
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

  // NEW: decide whether to only show Total (no subtotals) when there is no discount and no tax
  const hasDiscount = totals.itemDiscountTotal > 0 || totals.invoiceDiscount > 0;
  const hasTax = settings.showTax && (settings.taxPercent || 0) > 0;
  const simpleTotalOnly = !hasDiscount && !hasTax;

  // filtered lists (search)
  const filteredProducts = useMemo(() => {
    const q = debouncedProductQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [products, debouncedProductQuery]);

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

  // PDF export/print (supports printing specific invoice from history)
  const pdfRef = useRef<HTMLDivElement>(null);

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

  async function onLogoChange(file?: File | null) {
    if (!file) {
      setCompany({ ...company, logoDataUrl: "" });
      setImageError(null);
      return;
    }

    // Validate file type
    if (!isValidImageFile(file)) {
      setImageError("Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.");
      return;
    }

    // Check file size (warn if over 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("File terlalu besar (>5MB). Gambar akan dikompres otomatis.");
      // Continue processing with compression
    } else {
      setImageError(null);
    }

    setImageUploading(true);
    
    try {
      // Compress the image before saving
      const result = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 400,
        quality: 0.8,
        maxSizeKB: 500, // Target 500KB or less
        format: 'webp'
      });

      // Check if localStorage can handle this size
      if (!checkLocalStorageSpace(result.compressedSize)) {
        throw new Error('Storage penuh. Coba hapus data lama atau gunakan gambar yang lebih kecil.');
      }

      // Update company with compressed image
      setCompany({ ...company, logoDataUrl: result.dataUrl });
      
      // Show success message with compression info
      const compressionInfo = result.compressionRatio > 1.5 
        ? ` (dikompres ${result.compressionRatio.toFixed(1)}x dari ${formatFileSize(result.originalSize)})`
        : '';
      
      triggerToast(`Logo berhasil disimpan${compressionInfo}`);
      setImageError(null);

    } catch (error) {
      console.error('Logo upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memproses gambar';
      setImageError(errorMessage);
      triggerToast(`Error: ${errorMessage}`);
    } finally {
      setImageUploading(false);
    }
  }

  const themeColor = useMemo(() => {
    return settings.theme === "dark"
      ? "#0a0a0a"
      : settings.theme === "light"
      ? "#f8fafc"
      : undefined;
  }, [settings.theme]);

  // helper: add item and return its id (used by product picker)
  function addItemAndReturnId(): string | null {
    if (!currentInvoice) return null;
    const newItem = createBlankInvoiceItem();
    updateInvoice({ items: [...currentInvoice.items, newItem] });
    return newItem.id;
  }

  if (!hydrated || !currentInvoice) {
    return (
      <>
        <Head>
          <title>ILoveInvoice — Loading</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <FileText className="w-10 h-10 text-neutral-400" />
            <div className="h-2 w-40 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full w-1/2 bg-neutral-300 dark:bg-neutral-700 animate-pulse" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>ILoveInvoice — Invoice Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {themeColor ? <meta name="theme-color" content={themeColor} /> : null}
      </Head>

      <AccentPresence />

      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
        {/* Top App Bar */}
        <header className="no-print fixed top-0 inset-x-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 border-b border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-2xl px-4">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    "h-9 w-9 rounded-xl grid place-items-center",
                    settings.accent === "neutral" ? "bg-neutral-200 dark:bg-neutral-800" : accent.softBg
                  )}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <FileText className={cn("w-5 h-5", accent.text)} />
                </motion.div>
                <div className="flex flex-col leading-tight">
                  <div className="font-semibold tracking-tight">ILoveInvoice</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {activeTab === "invoice"
                      ? "Generator invoice • auto-save"
                      : activeTab === "products"
                      ? "Produk"
                      : activeTab === "company"
                      ? "Perusahaan"
                      : activeTab === "history"
                      ? "Riwayat"
                      : "Pengaturan"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "invoice" ? (
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
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {/* Main content with tab transitions */}
        <main className="mx-auto max-w-2xl px-4 pt-20 pb-28">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "invoice" && (
              <motion.div
                key="tab-invoice"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="space-y-4"
              >
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
                          onClick={() => setActiveTab("company")}
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
                              setActiveTab("products");
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
                                  if (products.length === 0) setActiveTab("products");
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
                            if (products.length === 0) setActiveTab("products");
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

                  {/* NEW: show only Total if no discounts AND no tax */}
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
              </motion.div>
            )}

            {activeTab === "products" && (
              <motion.div
                key="tab-products"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="space-y-4"
              >
                <Card>
                  <div className="text-sm font-medium mb-3">Tambah Produk</div>
                  <ProductEditor
                    accent={accent}
                    onSave={(p) => {
                      setProducts((prev) => [p, ...prev]);
                      triggerToast("Produk ditambahkan");
                    }}
                  />
                </Card>
                <Card>
                  <div className="text-sm font-medium">Daftar Produk</div>
                  <div className="mt-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        placeholder="Cari produk…"
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
                      />
                    </div>
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-center">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">
                        Tidak ada produk yang cocok.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {filteredProducts.map((p) => (
                        <ProductRow
                          key={p.id}
                          product={p}
                          currency={settings.currency}
                          onChange={(np) => {
                            setProducts((prev) => prev.map((x) => (x.id === p.id ? np : x)));
                          }}
                          onDelete={() => {
                            setProducts((prev) => prev.filter((x) => x.id !== p.id));
                            triggerToast("Produk dihapus");
                          }}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {activeTab === "company" && (
              <motion.div
                key="tab-company"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="space-y-4"
              >
                <Card>
                  <div className="text-sm font-medium mb-3">Profil Perusahaan</div>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="max-w-[220px] max-h-16 rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-neutral-900 flex items-center justify-center p-1 relative">
                        {imageUploading ? (
                          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className={cn("w-5 h-5 animate-spin", accent.text)} />
                              <div className="text-[10px] text-neutral-500">Memproses...</div>
                            </div>
                          </div>
                        ) : null}
                        {company.logoDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={company.logoDataUrl}
                            alt="Logo"
                            className="max-h-16 w-auto object-contain"
                          />
                        ) : (
                          <Building2 className="w-7 h-7 text-neutral-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <label className="col-span-2">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Logo Perusahaan</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onLogoChange(e.target.files?.[0])}
                            disabled={imageUploading}
                            className={cn(
                              "block w-full text-xs text-neutral-600 dark:text-neutral-300 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:text-white file:cursor-pointer file:bg-neutral-900 hover:file:bg-black dark:file:bg-white dark:file:text-neutral-900 dark:hover:file:bg-neutral-200",
                              imageUploading && "opacity-50 pointer-events-none"
                            )}
                          />
                          {company.logoDataUrl && !imageUploading ? (
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onLogoChange(null)}
                              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
                            >
                              Hapus
                            </motion.button>
                          ) : null}
                        </div>
                        {imageError && (
                          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                            {imageError}
                          </div>
                        )}
                        {companyError?.type === 'quota_exceeded' && (
                          <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-2 py-1">
                            {companyError.message}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                          💡 Gambar besar akan dikompres otomatis untuk menghemat storage. 
                          Format yang didukung: JPG, PNG, GIF, WebP.
                        </div>
                      </label>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="grid grid-cols-1 gap-3">
                    <TextField
                      label="Nama Perusahaan"
                      value={company.name}
                      onChange={(v) => setCompany({ ...company, name: v })}
                    />
                    <TextArea
                      label="Alamat Perusahaan"
                      rows={3}
                      value={company.address}
                      onChange={(v) => setCompany({ ...company, address: v })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        label="No. Telp Perusahaan"
                        value={company.phone || ""}
                        onChange={(v) => setCompany({ ...company, phone: v })}
                      />
                      <TextField
                        label="Email Perusahaan"
                        type="email"
                        value={company.email || ""}
                        onChange={(v) => setCompany({ ...company, email: v })}
                      />
                    </div>
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
                      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
                        Visibilitas Kontak di Invoice
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <div className="text-sm">Tampilkan No. Telp</div>
                        <Toggle
                          checked={settings.showCompanyPhone}
                          onChange={(val) => setSettings({ ...settings, showCompanyPhone: val })}
                        />
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <div className="text-sm">Tampilkan Email</div>
                        <Toggle
                          checked={settings.showCompanyEmail}
                          onChange={(val) => setSettings({ ...settings, showCompanyEmail: val })}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="tab-history"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="space-y-4"
              >
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
                      {filteredInvoices.map((inv) => {
                        const invoiceTotals = computeTotals(inv, settings);
                        const isRecent = (Date.now() - inv.updatedAt) < 24 * 60 * 60 * 1000; // 24 hours
                        
                        return (
                          <motion.div
                            key={inv.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-200"
                          >
                            <div className="space-y-3">
                              {/* Invoice Header Info */}
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "flex-shrink-0 w-10 h-10 rounded-xl grid place-items-center border transition-colors",
                                  isRecent 
                                    ? cn(accent.softBg, "border-transparent")
                                    : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                )}>
                                  <Receipt className={cn("w-5 h-5", isRecent ? accent.text : "text-neutral-400")} />
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
                                    onClick={() => setPreviewInvoice(inv)}
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
                                      setActiveTab("invoice");
                                      setShowPreview(true);
                                    }}
                                    className={cn(
                                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-medium transition-colors",
                                      accent.ring
                                    )}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
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
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="tab-settings"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="space-y-4"
              >
                <Card>
                  <div className="text-sm font-medium mb-3">Tema</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["system", "light", "dark"] as ThemeMode[]).map((t) => (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={t}
                        onClick={() => setSettings({ ...settings, theme: t })}
                        className={cn(
                          "py-2 rounded-xl border text-sm transition",
                          settings.theme === t
                            ? cn(accent.softBg, "border-transparent")
                            : "border-neutral-200 dark:border-neutral-800"
                        )}
                      >
                        {t === "system" ? "System" : t === "light" ? "Light" : "Dark"}
                      </motion.button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="text-sm font-medium mb-3">Aksen Warna</div>
                  <div className="flex items-center gap-2">
                    {(["indigo", "emerald", "sky", "amber", "rose", "violet", "neutral"] as AccentKey[]).map(
                      (key) => (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          key={key}
                          aria-label={key}
                          onClick={() => setSettings({ ...settings, accent: key })}
                          className={cn(
                            "h-9 w-9 rounded-full border transition grid place-items-center",
                            key === "neutral"
                              ? "bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                              : "border-transparent",
                            ACCENT_MAP[key].solid
                          )}
                        >
                          {settings.accent === key ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : null}
                        </motion.button>
                      )
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="text-sm font-medium mb-3">Format & Pajak</div>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Currency"
                      value={settings.currency}
                      onChange={(v) =>
                        setSettings({ ...settings, currency: v as Settings["currency"] })
                      }
                      options={[
                        { label: "IDR (Rp)", value: "IDR" },
                        { label: "USD ($)", value: "USD" },
                        { label: "EUR (€)", value: "EUR" },
                        { label: "SGD ($)", value: "SGD" },
                        { label: "JPY (¥)", value: "JPY" },
                      ]}
                    />
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between">
                      <div className="text-sm">Aktifkan Pajak</div>
                      <Toggle
                        checked={settings.showTax}
                        onChange={(v) => setSettings({ ...settings, showTax: v })}
                      />
                    </div>
                    <NumberField
                      label="Pajak % (invoice)"
                      value={String(settings.taxPercent ?? 0)}
                      onChange={(v) =>
                        setSettings({
                          ...settings,
                          taxPercent: Math.max(0, parseNumber(v)),
                        })
                      }
                    />
                    <TextField
                      label="Footer Invoice"
                      value={settings.invoiceFooter ?? DEFAULTS.settings.invoiceFooter}
                      onChange={(v) => setSettings({ ...settings, invoiceFooter: v })}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Pajak dihitung dari subtotal setelah semua diskon. Footer akan tampil di bagian bawah invoice.
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom nav */}
        <nav className="no-print fixed bottom-0 inset-x-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-900/60 border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-2xl px-4">
            <div className="flex items-center justify-between h-16">
              <TabButton
                active={activeTab === "invoice"}
                label="Invoice"
                onClick={() => setActiveTab("invoice")}
                icon={<FileText className="w-5 h-5" />}
                accent={accent}
              />
              <TabButton
                active={activeTab === "products"}
                label="Produk"
                onClick={() => setActiveTab("products")}
                icon={<Box className="w-5 h-5" />}
                accent={accent}
              />
              <TabButton
                active={activeTab === "company"}
                label="Perusahaan"
                onClick={() => setActiveTab("company")}
                icon={<Building2 className="w-5 h-5" />}
                accent={accent}
              />
              <TabButton
                active={activeTab === "history"}
                label="Riwayat"
                onClick={() => setActiveTab("history")}
                icon={<Clock className="w-5 h-5" />}
                accent={accent}
              />
              <TabButton
                active={activeTab === "settings"}
                label="Settings"
                onClick={() => setActiveTab("settings")}
                icon={<SettingsIcon className="w-5 h-5" />}
                accent={accent}
              />
            </div>
          </div>
        </nav>

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
                                setActiveTab("products");
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

        {/* Invoice Preview Modal */}
        <AnimatePresence>
          {previewInvoice ? (
            <div className="no-print fixed inset-0 z-50">
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
                            setActiveTab("invoice");
                            setShowPreview(true);
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
        <AnimatePresence>
          {toast ? (
            <motion.div
              className="no-print fixed bottom-20 inset-x-0 z-50"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            >
              <div className="mx-auto max-w-2xl px-4">
                <div className="px-4 py-2 rounded-full text-sm text-white shadow-lg bg-neutral-900/90 dark:bg-white/90 dark:text-neutral-900 w-fit mx-auto">
                  {toast}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

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
      </div>
    </>
  );
}