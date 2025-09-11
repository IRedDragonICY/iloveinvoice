import type { Invoice, InvoiceItem, Settings, InvoiceTotals } from './types';
import { generateId, generateInvoiceNumber, clamp } from './utils';

export function createNewInvoice(): Invoice {
  return {
    id: generateId("inv"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    number: generateInvoiceNumber(),
    customer: { name: "", address: "", phone: "", email: "" },
    items: [],
    notes: "",
    invoiceDiscountEnabled: false,
    invoiceDiscountType: "percent",
    invoiceDiscountValue: 0,
  };
}

export function createBlankInvoiceItem(): InvoiceItem {
  return {
    id: generateId("it"),
    name: "",
    description: "",
    quantity: 1,
    price: 0,
    discountEnabled: false,
    discountType: "percent",
    discountValue: 0,
  };
}

// compute totals with discounts
export function computeTotals(inv: Invoice, settings: Settings): InvoiceTotals {
  const rows = inv.items.map((it) => {
    const qty = clamp(it.quantity || 0, 0);
    const price = clamp(it.price || 0, 0);
    const base = qty * price;

    let discount = 0;
    if (it.discountEnabled && (it.discountValue || 0) > 0) {
      if ((it.discountType || "percent") === "amount") {
        discount = clamp(it.discountValue || 0, 0, base);
      } else {
        discount = clamp(((it.discountValue || 0) / 100) * base, 0, base);
      }
    }

    const lineTotal = clamp(base - discount, 0);
    return { base, discount, lineTotal };
  });

  const subtotalBase = rows.reduce((s, r) => s + r.base, 0);
  const itemDiscountTotal = rows.reduce((s, r) => s + r.discount, 0);
  const subtotalAfterItems = clamp(subtotalBase - itemDiscountTotal, 0);

  let invoiceDiscount = 0;
  if (inv.invoiceDiscountEnabled && (inv.invoiceDiscountValue || 0) > 0) {
    if ((inv.invoiceDiscountType || "percent") === "amount") {
      invoiceDiscount = clamp(inv.invoiceDiscountValue || 0, 0, subtotalAfterItems);
    } else {
      invoiceDiscount = clamp(((inv.invoiceDiscountValue || 0) / 100) * subtotalAfterItems, 0, subtotalAfterItems);
    }
  }

  const taxable = clamp(subtotalAfterItems - invoiceDiscount, 0);
  const taxTotal = settings.showTax ? (taxable * (settings.taxPercent || 0)) / 100 : 0;
  const total = taxable + taxTotal;

  return {
    subtotalBase,
    itemDiscountTotal,
    invoiceDiscount,
    subtotalAfterItems,
    taxable,
    taxTotal,
    total,
  };
}

