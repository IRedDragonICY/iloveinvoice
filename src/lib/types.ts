export type ThemeMode = "system" | "light" | "dark";
export type AccentKey = "indigo" | "emerald" | "sky" | "amber" | "rose" | "violet" | "neutral";
export type DiscountType = "percent" | "amount";

export interface Company {
  logoDataUrl?: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  // per-item discount (default off)
  discountEnabled?: boolean;
  discountType?: DiscountType;
  discountValue?: number;
}

export interface Customer {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Invoice {
  id: string;
  createdAt: number;
  updatedAt: number;
  number: string;
  customer: Customer;
  items: InvoiceItem[];
  notes?: string;
  // invoice-level discount (default off)
  invoiceDiscountEnabled?: boolean;
  invoiceDiscountType?: DiscountType;
  invoiceDiscountValue?: number;
}

export interface Settings {
  theme: ThemeMode;
  accent: AccentKey;
  currency: "IDR" | "USD" | "EUR" | "SGD" | "JPY";
  showTax: boolean;
  taxPercent: number;      // invoice-level tax percent (applies to subtotal after discounts)
  showCompanyPhone: boolean;
  showCompanyEmail: boolean;
  invoiceFooter: string;   // custom footer text
}

export type TabKey = "invoice" | "products" | "company" | "history" | "settings";

export interface InvoiceTotals {
  subtotalBase: number;
  itemDiscountTotal: number;
  invoiceDiscount: number;
  subtotalAfterItems: number;
  taxable: number;
  taxTotal: number;
  total: number;
}

export interface AccentConfig {
  solid: string;
  solidHover: string;
  softBg: string;
  text: string;
  ring: string;
  chip: string;
}

