// pages/index.tsx
'use client';
import Head from "next/head";
import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
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
} from "lucide-react";

/**
 * EZinvoice — mobile-first invoice generator
 * - Next.js + Tailwind CSS (Material You vibes)
 * - LocalStorage persistence (company, products, invoices, settings)
 * - Invoice history (edit/delete), auto-save
 * - Optional phone/email on invoice
 * - Invoice-level tax (not per-item)
 * - Export to PDF via jsPDF + html2canvas-pro (multi-page, crisp)
 * - Bottom navigation, light/dark mode, animations
 *
 * Notes:
 * - Tailwind needs darkMode: 'class'
 * - Deps: npm i jspdf html2canvas-pro framer-motion lucide-react
 */

type ThemeMode = "system" | "light" | "dark";
type AccentKey = "indigo" | "emerald" | "sky" | "amber" | "rose" | "violet" | "neutral";

type Company = {
  logoDataUrl?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  tax?: number; // legacy, ignored
};

type InvoiceItem = {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  tax?: number; // legacy, ignored
};

type Customer = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

type Invoice = {
  id: string;
  createdAt: number;
  updatedAt: number;
  number: string;
  customer: Customer;
  items: InvoiceItem[];
  notes?: string;
};

type Settings = {
  theme: ThemeMode;
  accent: AccentKey;
  currency: "IDR" | "USD" | "EUR" | "SGD" | "JPY";
  showTax: boolean;        // show invoice-level tax on totals
  taxPercent: number;      // invoice-level tax percent (applies to subtotal)
  showCompanyPhone: boolean;
  showCompanyEmail: boolean;
};

const STORAGE = {
  company: "ez_company",
  products: "ez_products",
  invoices: "ez_invoices",
  currentInvoiceId: "ez_current_invoice_id",
  settings: "ez_settings",
};

const DEFAULTS = {
  company: {
    name: "",
    address: "",
    phone: "",
    email: "",
    logoDataUrl: "",
  } as Company,
  products: [] as Product[],
  settings: {
    theme: "system",
    accent: "indigo",
    currency: "IDR",
    showTax: true,
    taxPercent: 10,
    showCompanyPhone: true,
    showCompanyEmail: true,
  } as Settings,
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const ACCENT_MAP: Record<
  AccentKey,
  {
    solid: string;
    solidHover: string;
    softBg: string;
    text: string;
    ring: string;
    chip: string;
  }
> = {
  indigo: {
    solid: "bg-indigo-600",
    solidHover: "hover:bg-indigo-700",
    softBg: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-600",
    ring: "focus-visible:ring-indigo-500",
    chip: "bg-indigo-600/10 text-indigo-700 dark:text-indigo-300",
  },
  emerald: {
    solid: "bg-emerald-600",
    solidHover: "hover:bg-emerald-700",
    softBg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600",
    ring: "focus-visible:ring-emerald-500",
    chip: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  },
  sky: {
    solid: "bg-sky-600",
    solidHover: "hover:bg-sky-700",
    softBg: "bg-sky-50 dark:bg-sky-500/10",
    text: "text-sky-600",
    ring: "focus-visible:ring-sky-500",
    chip: "bg-sky-600/10 text-sky-700 dark:text-sky-300",
  },
  amber: {
    solid: "bg-amber-600",
    solidHover: "hover:bg-amber-700",
    softBg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600",
    ring: "focus-visible:ring-amber-500",
    chip: "bg-amber-600/10 text-amber-700 dark:text-amber-300",
  },
  rose: {
    solid: "bg-rose-600",
    solidHover: "hover:bg-rose-700",
    softBg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-600",
    ring: "focus-visible:ring-rose-500",
    chip: "bg-rose-600/10 text-rose-700 dark:text-rose-300",
  },
  violet: {
    solid: "bg-violet-600",
    solidHover: "hover:bg-violet-700",
    softBg: "bg-violet-50 dark:bg-violet-500/10",
    text: "text-violet-600",
    ring: "focus-visible:ring-violet-500",
    chip: "bg-violet-600/10 text-violet-700 dark:text-violet-300",
  },
  neutral: {
    solid: "bg-neutral-800",
    solidHover: "hover:bg-neutral-900",
    softBg: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-700 dark:text-neutral-300",
    ring: "focus-visible:ring-neutral-500",
    chip: "bg-neutral-700/10 text-neutral-700 dark:text-neutral-300",
  },
};

const AccentPresence = () => (
  <div className="hidden">
    <div className="bg-indigo-600 hover:bg-indigo-700 bg-indigo-50 text-indigo-600 focus-visible:ring-indigo-500 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300" />
    <div className="bg-emerald-600 hover:bg-emerald-700 bg-emerald-50 text-emerald-600 focus-visible:ring-emerald-500 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300" />
    <div className="bg-sky-600 hover:bg-sky-700 bg-sky-50 text-sky-600 focus-visible:ring-sky-500 bg-sky-600/10 text-sky-700 dark:text-sky-300" />
    <div className="bg-amber-600 hover:bg-amber-700 bg-amber-50 text-amber-600 focus-visible:ring-amber-500 bg-amber-600/10 text-amber-700 dark:text-amber-300" />
    <div className="bg-rose-600 hover:bg-rose-700 bg-rose-50 text-rose-600 focus-visible:ring-rose-500 bg-rose-600/10 text-rose-700 dark:text-rose-300" />
    <div className="bg-violet-600 hover:bg-violet-700 bg-violet-50 text-violet-600 focus-visible:ring-violet-500 bg-violet-600/10 text-violet-700 dark:text-violet-300" />
    <div className="bg-neutral-800 hover:bg-neutral-900 bg-neutral-100 text-neutral-700 focus-visible:ring-neutral-500 bg-neutral-700/10 text-neutral-700 dark:text-neutral-300" />
  </div>
);

function usePersistentState<T>(key: string, initial: T) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        // simple migration: if old defaultTaxPercent exists, map to taxPercent
        if (key === STORAGE.settings && parsed && typeof parsed === "object") {
          if (parsed.defaultTaxPercent != null && parsed.taxPercent == null) {
            parsed.taxPercent = parsed.defaultTaxPercent;
          }
        }
        setState(parsed);
      }
    } catch {}
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, ready, state]);

  return [state, setState, ready] as const;
}

function currencyLocale(currency: Settings["currency"]) {
  switch (currency) {
    case "IDR":
      return "id-ID";
    case "USD":
      return "en-US";
    case "EUR":
      return "de-DE";
    case "SGD":
      return "en-SG";
    case "JPY":
      return "ja-JP";
  }
}

function formatCurrency(value: number, currency: Settings["currency"]) {
  try {
    return new Intl.NumberFormat(currencyLocale(currency), {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(value || 0);
  } catch {
    const prefixMap: Record<Settings["currency"], string> = {
      IDR: "Rp",
      USD: "$",
      EUR: "€",
      SGD: "$",
      JPY: "¥",
    };
    const frac = currency === "IDR" || currency === "JPY" ? 0 : 2;
    return `${prefixMap[currency]} ${Number.isFinite(value) ? value.toFixed(frac) : "0"}`;
  }
}

function parseNumber(input: string) {
  const n = parseFloat(input.replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function generateInvoiceNumber() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `EZ-${yr}${mon}${day}-${rnd}`;
}

function createNewInvoice(): Invoice {
  return {
    id: generateId("inv"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    number: generateInvoiceNumber(),
    customer: { name: "", address: "", phone: "", email: "" },
    items: [],
    notes: "",
  };
}

type TabKey = "invoice" | "products" | "company" | "history" | "settings";

function useDebounced<T>(value: T, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function EZinvoice() {
  const [settings, setSettings, settingsReady] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [company, setCompany, companyReady] = usePersistentState<Company>(STORAGE.company, DEFAULTS.company);
  const [products, setProducts, productsReady] = usePersistentState<Product[]>(STORAGE.products, DEFAULTS.products);
  const [invoices, setInvoices, invoicesReady] = usePersistentState<Invoice[]>(STORAGE.invoices, []);
  const [currentInvoiceId, setCurrentInvoiceId, currentIdReady] = usePersistentState<string | null>(
    STORAGE.currentInvoiceId,
    null
  );

  // state management
  const [activeTab, setActiveTab] = useState<TabKey>("invoice");
  const [productPickerForItem, setProductPickerForItem] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const debouncedProductQuery = useDebounced(productQuery, 200);
  const debouncedHistoryQuery = useDebounced(historyQuery, 200);

  const hydrated = settingsReady && companyReady && productsReady && invoicesReady && currentIdReady;

  // theme
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      const isDark = settings.theme === "dark" || (settings.theme === "system" && prefersDark);
      root.classList.toggle("dark", isDark);
    };
    apply();
    if (settings.theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply();
      mql.addEventListener?.("change", handler);
      return () => mql.removeEventListener?.("change", handler);
    }
  }, [settings.theme]);

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
          }
        : it
    );
    updateInvoice({ items });
  }

  function addBlankItem() {
    if (!currentInvoice) return;
    const newItem: InvoiceItem = {
      id: generateId("it"),
      name: "",
      description: "",
      quantity: 1,
      price: 0,
    };
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
      ...inv,
      id: generateId("inv"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      number: generateInvoiceNumber(),
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
    setTimeout(() => setToast(null), 2000);
  }

  // totals with INVOICE-LEVEL TAX
  const totals = useMemo(() => {
    if (!currentInvoice) return { subtotal: 0, taxTotal: 0, total: 0 };
    const subtotal = currentInvoice.items.reduce((acc, it) => acc + (it.quantity || 0) * (it.price || 0), 0);
    const taxTotal = settings.showTax ? (subtotal * (settings.taxPercent || 0)) / 100 : 0;
    const total = subtotal + taxTotal;
    return { subtotal, taxTotal, total };
  }, [currentInvoice, settings.showTax, settings.taxPercent]);

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

  // PDF export (improved UX: toast after overlay ends; lazy mount capture node; small perf tweaks)
  const pdfRef = useRef<HTMLDivElement>(null);
  async function onExportPDF() {
    if (!currentInvoice) return;
    try {
      setExporting(true);
      // wait for hidden capture area to mount and paint
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      const sourceNode = pdfRef.current;
      if (!sourceNode) throw new Error("PDF source not ready");

      const scale = Math.min(2, window.devicePixelRatio || 1);
      const canvas = await html2canvas(sourceNode, {
        backgroundColor: "#ffffff",
        scale,
        useCORS: true,
        logging: false,
        removeContainer: true,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      pdf.setProperties({
        title: `Invoice ${currentInvoice.number}`,
        subject: "EZinvoice PDF",
        author: company.name || "EZinvoice",
        creator: "EZinvoice",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save(`${currentInvoice.number}.pdf`);
      // overlay off first, then toast (avoid "toast shown while still loading" feel)
      setExporting(false);
      setTimeout(() => triggerToast("PDF berhasil dibuat"), 10);
    } catch (e) {
      console.error(e);
      setExporting(false);
      triggerToast("Gagal membuat PDF");
    }
  }

  function onLogoChange(file?: File | null) {
    if (!file) {
      setCompany({ ...company, logoDataUrl: "" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCompany({ ...company, logoDataUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  }

  const themeColor = useMemo(() => {
    return settings.theme === "dark"
      ? "#0a0a0a"
      : settings.theme === "light"
      ? "#f8fafc"
      : undefined;
  }, [settings.theme]);

  if (!hydrated || !currentInvoice) {
    return (
      <>
        <Head>
          <title>EZinvoice — Loading</title>
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
        <title>EZinvoice — Invoice Generator</title>
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
                  <div className="font-semibold tracking-tight">EZinvoice</div>
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
                    onClick={onExportPDF}
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
                      <div className="w-14 h-14 rounded-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden bg-white dark:bg-neutral-900 grid place-items-center">
                        {company.logoDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={company.logoDataUrl} alt="Logo" className="w-full h-full object-cover" />
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
                      {currentInvoice.items.map((it) => (
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
                                  min={0}
                                  value={String(it.quantity)}
                                  onChange={(v) => updateItem(it.id, { quantity: parseNumber(v) })}
                                />
                                <MoneyField
                                  label="Harga"
                                  currency={settings.currency}
                                  value={it.price}
                                  onChange={(value) => updateItem(it.id, { price: value })}
                                />
                                <div />
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {it.productId ? "Ditarik dari produk" : "Manual"}
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-medium">
                                    {formatCurrency(
                                      (it.quantity || 0) * (it.price || 0),
                                      settings.currency
                                    )}
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
                      ))}

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

                {/* Totals */}
                <Card>
                  <div className="space-y-2">
                    <Row label="Subtotal" value={formatCurrency(totals.subtotal, settings.currency)} />
                    {settings.showTax ? (
                      <Row label={`Pajak (${settings.taxPercent || 0}%)`} value={formatCurrency(totals.taxTotal, settings.currency)} />
                    ) : null}
                    <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                    <Row
                      label="Total"
                      value={formatCurrency(totals.total, settings.currency)}
                      strong
                    />
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
                        invoice={currentInvoice!}
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
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={onExportPDF}
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
                      <div className="w-16 h-16 rounded-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden bg-white dark:bg-neutral-900 grid place-items-center">
                        {company.logoDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={company.logoDataUrl} alt="Logo" className="w-full h-full object-cover" />
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
                            className="block w-full text-xs text-neutral-600 dark:text-neutral-300 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:text-white file:cursor-pointer file:bg-neutral-900 hover:file:bg-black dark:file:bg-white dark:file:text-neutral-900 dark:hover:file:bg-neutral-200"
                          />
                          {company.logoDataUrl ? (
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onLogoChange(null)}
                              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
                            >
                              Hapus
                            </motion.button>
                          ) : null}
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
                <Card>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">Riwayat Invoice</div>
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

                <Card>
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historyQuery}
                      onChange={(e) => setHistoryQuery(e.target.value)}
                      placeholder="Cari invoice (no, nama pelanggan, catatan)…"
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
                    />
                  </div>

                  {filteredInvoices.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-center">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">
                        Tidak ada invoice yang cocok.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 divide-y divide-neutral-200 dark:divide-neutral-800">
                      {filteredInvoices.map((inv) => (
                        <div key={inv.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl grid place-items-center border border-neutral-200 dark:border-neutral-800">
                              <FileText className={cn("w-5 h-5", accent.text)} />
                            </div>
                            <div className="leading-tight">
                              <div className="text-sm font-medium">{inv.number}</div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                {new Date(inv.updatedAt).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {inv.customer.name || "-"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setCurrentInvoiceId(inv.id);
                                setActiveTab("invoice");
                                setShowPreview(true);
                              }}
                              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
                            >
                              Edit
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => duplicateInvoice(inv)}
                              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
                            >
                              Duplikat
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => deleteInvoice(inv.id)}
                              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400"
                            >
                              Hapus
                            </motion.button>
                          </div>
                        </div>
                      ))}
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
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                    Pajak dihitung dari subtotal seluruh item.
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

        {/* Hidden offscreen PDF area (only mounted during export for perf) */}
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
                  invoice={currentInvoice!}
                  settings={settings}
                  totals={totals}
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

  // helper: add item and return its id (used by product picker)
  function addItemAndReturnId(): string | null {
    if (!currentInvoice) return null;
    const id = generateId("it");
    const newItem: InvoiceItem = {
      id,
      name: "",
      description: "",
      quantity: 1,
      price: 0,
    };
    updateInvoice({ items: [...currentInvoice.items, newItem] });
    return id;
  }
}

/* Components */

function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={cn(
        "rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-neutral-900/50 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_10px_30px_-12px_rgba(0,0,0,0.2)] p-4 space-y-3",
        className
      )}
    >
      {children}
    </motion.section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-neutral-600 dark:text-neutral-300">{label}</div>
      <div className={cn("text-sm", strong ? "font-semibold" : "font-medium")}>{value}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
}) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <input
        inputMode="decimal"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
        min={min}
      />
    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  currency,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  currency: Settings["currency"];
}) {
  const [raw, setRaw] = useState(String(value || 0));
  useEffect(() => {
    setRaw(String(value ?? 0));
  }, [value]);
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <input
        inputMode="decimal"
        type="text"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(parseNumber(e.target.value));
        }}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
        placeholder={formatCurrency(0, currency)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
      >
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "h-7 w-12 rounded-full relative transition border",
        checked
          ? "bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white"
          : "bg-neutral-200 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 h-5 w-5 rounded-full bg-white dark:bg-neutral-900 transition",
          checked ? "translate-x-5" : "translate-x-0",
          "shadow"
        )}
      />
    </button>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
  accent,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  accent: (typeof ACCENT_MAP)[AccentKey];
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition",
        active ? cn(accent.softBg, "text-neutral-900 dark:text-white") : "text-neutral-500"
      )}
    >
      <div className="w-6 h-6 grid place-items-center">{icon}</div>
      <div className="text-[10px] leading-none">{label}</div>
    </motion.button>
  );
}

function ProductEditor({
  accent,
  onSave,
}: {
  accent: (typeof ACCENT_MAP)[AccentKey];
  onSave: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<number>(0);

  function reset() {
    setName("");
    setDesc("");
    setPrice(0);
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <TextField label="Nama Produk" value={name} onChange={setName} />
      <TextArea label="Deskripsi" value={desc} onChange={setDesc} rows={2} />
      <div className="grid grid-cols-1 gap-3">
        <MoneyField label="Harga" value={price} onChange={setPrice} currency="IDR" />
      </div>
      <div className="flex items-center justify-end">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (!name.trim()) return;
            const p: Product = {
              id: generateId("prd"),
              name,
              description: desc,
              price,
            };
            onSave(p);
            reset();
          }}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm transition",
            accent.solid,
            accent.solidHover
          )}
        >
          <Plus className="w-4 h-4 text-white" />
          Simpan Produk
        </motion.button>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  currency,
  onChange,
  onDelete,
}: {
  product: Product;
  currency: Settings["currency"];
  onChange: (p: Product) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Product>(product);
  useEffect(() => setDraft(product), [product]);
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
      {editing ? (
        <div className="grid grid-cols-1 gap-3">
          <TextField
            label="Nama Produk"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <TextArea
            label="Deskripsi"
            value={draft.description || ""}
            onChange={(v) => setDraft({ ...draft, description: v })}
            rows={2}
          />
          <div className="grid grid-cols-1 gap-3">
            <MoneyField
              label="Harga"
              value={draft.price}
              onChange={(v) => setDraft({ ...draft, price: v })}
              currency={currency}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditing(false);
                setDraft(product);
              }}
              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
            >
              Batal
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onChange(draft);
                setEditing(false);
              }}
              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
            >
              Simpan
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{product.name}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {product.description}
            </div>
            <div className="mt-1 inline-flex items-center gap-2">
              <span className="text-xs font-medium">
                {formatCurrency(product.price, currency)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setEditing(true)}
              className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800"
            >
              <Pencil className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onDelete}
              className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoicePreview({
  company,
  invoice,
  settings,
  totals,
  printing,
}: {
  company: Company;
  invoice: Invoice;
  settings: Settings;
  totals: { subtotal: number; taxTotal: number; total: number };
  printing?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden grid place-items-center">
              {company.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoDataUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-6 h-6 text-neutral-400" />
              )}
            </div>
            <div className="leading-tight">
              <div className="font-semibold">{company.name || "Nama Perusahaan"}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">
                {company.address || "Alamat perusahaan..."}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-col mt-1">
                {settings.showCompanyPhone && company.phone ? <span>{company.phone}</span> : null}
                {settings.showCompanyEmail && company.email ? <span>{company.email}</span> : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Invoice</div>
            <div className="text-sm font-medium">{invoice.number}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Tagihan kepada</div>
            <div className="text-sm font-medium">{invoice.customer.name || "-"}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">
              {invoice.customer.address || "-"}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Kontak</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {invoice.customer.phone || "-"}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {invoice.customer.email || "-"}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 dark:text-neutral-400">
                <th className="py-2">Produk</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Harga</th>
                <th className="py-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length === 0 ? (
                <tr>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={4}>
                    Tidak ada item.
                  </td>
                </tr>
              ) : (
                invoice.items.map((it) => {
                  const base = (it.quantity || 0) * (it.price || 0);
                  return (
                    <tr key={it.id} className="align-top">
                      <td className="py-3">
                        <div className="font-medium">{it.name || "-"}</div>
                        {it.description ? (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {it.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3">{it.quantity || 0}</td>
                      <td className="py-3">{formatCurrency(it.price || 0, settings.currency)}</td>
                      <td className="py-3 text-right">{formatCurrency(base, settings.currency)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            {invoice.notes ? (
              <>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Catatan</div>
                <div className="text-sm whitespace-pre-wrap">{invoice.notes}</div>
              </>
            ) : null}
          </div>
          <div className="sm:text-right">
            <div className="space-y-1">
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-sm text-neutral-600 dark:text-neutral-300">Subtotal</div>
                <div className="text-sm font-medium">
                  {formatCurrency(totals.subtotal, settings.currency)}
                </div>
              </div>
              {settings.showTax ? (
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-sm text-neutral-600 dark:text-neutral-300">Pajak ({settings.taxPercent || 0}%)</div>
                  <div className="text-sm font-medium">
                    {formatCurrency(totals.taxTotal, settings.currency)}
                  </div>
                </div>
              ) : null}
              <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="text-sm font-semibold">Total</div>
                <div className="text-sm font-semibold">
                  {formatCurrency(totals.total, settings.currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!printing ? (
          <div className="mt-10 text-[10px] text-neutral-400 text-center">
            Dibuat dengan EZinvoice
          </div>
        ) : null}
      </div>
    </div>
  );
}