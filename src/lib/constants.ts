import type { AccentKey, Company, Product, Settings, AccentConfig } from './types';

export const STORAGE = {
  company: "ez_company",
  products: "ez_products",
  invoices: "ez_invoices",
  currentInvoiceId: "ez_current_invoice_id",
  settings: "ez_settings",
} as const;

export const DEFAULTS = {
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
    accent: "neutral",
    currency: "IDR",
    showTax: true,
    taxPercent: 10,
    showCompanyPhone: true,
    showCompanyEmail: true,
    invoiceFooter: "Terimakasih sudah berbelanja",
  } as Settings,
} as const;

export const ACCENT_MAP: Record<AccentKey, AccentConfig> = {
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

export const CURRENCY_LOCALES = {
  IDR: "id-ID",
  USD: "en-US",
  EUR: "de-DE",
  SGD: "en-SG",
  JPY: "ja-JP",
} as const;

