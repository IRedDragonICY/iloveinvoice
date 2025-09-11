import type { Settings } from './types';
import { CURRENCY_LOCALES } from './constants';

export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function currencyLocale(currency: Settings["currency"]) {
  return CURRENCY_LOCALES[currency];
}

export function formatCurrency(value: number, currency: Settings["currency"]) {
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

export function parseNumber(input: string) {
  const n = parseFloat(input.replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function generateInvoiceNumber() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `ILI-${yr}${mon}${day}-${rnd}`;
}

export function clamp(n: number, min = 0, max = Number.POSITIVE_INFINITY) {
  return Math.min(Math.max(n, min), max);
}

