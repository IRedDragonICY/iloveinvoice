import { memo } from 'react';
import { FileText } from 'lucide-react';
import { formatCurrency, clamp } from '@/lib/utils';
import { DEFAULTS } from '@/lib/constants';
import type { Company, Invoice, Settings, InvoiceTotals } from '@/lib/types';

interface InvoicePreviewProps {
  company: Company;
  invoice: Invoice;
  settings: Settings;
  totals: InvoiceTotals;
  printing?: boolean;
}

function InvoicePreviewInner({
  company,
  invoice,
  settings,
  totals,
  printing,
}: InvoicePreviewProps) {
  const anyItemHasDiscount = invoice.items.some(
    (it) => it.discountEnabled && (it.discountValue || 0) > 0
  );

  // Same simple total logic for preview
  const hasDiscount = totals.itemDiscountTotal > 0 || totals.invoiceDiscount > 0;
  const hasTax = settings.showTax && (settings.taxPercent || 0) > 0;
  const simpleTotalOnly = !hasDiscount && !hasTax;

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="max-w-[180px] max-h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-center p-1">
              {company.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoDataUrl}
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
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

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 dark:text-neutral-400">
                <th className="py-2">Produk</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Harga</th>
                {anyItemHasDiscount ? <th className="py-2">Diskon</th> : null}
                <th className="py-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length === 0 ? (
                <tr>
                  <td className="py-3 text-neutral-500 dark:text-neutral-400" colSpan={anyItemHasDiscount ? 5 : 4}>
                    Tidak ada item.
                  </td>
                </tr>
              ) : (
                invoice.items.map((it) => {
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
                      <td className="py-3">{qty}</td>
                      <td className="py-3">{formatCurrency(price, settings.currency)}</td>
                      {anyItemHasDiscount ? (
                        <td className="py-3">
                          {discount > 0 ? `− ${formatCurrency(discount, settings.currency)}` : "-"}
                        </td>
                      ) : null}
                      <td className="py-3 text-right">{formatCurrency(lineTotal, settings.currency)}</td>
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
              {simpleTotalOnly ? (
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-sm font-semibold">Total</div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(totals.total, settings.currency)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-sm text-neutral-600 dark:text-neutral-300">Subtotal awal</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(totals.subtotalBase, settings.currency)}
                    </div>
                  </div>
                  {totals.itemDiscountTotal > 0 ? (
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">Diskon item</div>
                      <div className="text-sm font-medium">
                        − {formatCurrency(totals.itemDiscountTotal, settings.currency)}
                      </div>
                    </div>
                  ) : null}
                  {(totals.itemDiscountTotal > 0 || invoice.invoiceDiscountEnabled) ? (
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">Subtotal setelah diskon item</div>
                      <div className="text-sm font-medium">
                        {formatCurrency(totals.subtotalAfterItems, settings.currency)}
                      </div>
                    </div>
                  ) : null}
                  {totals.invoiceDiscount > 0 ? (
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">Diskon invoice</div>
                      <div className="text-sm font-medium">
                        − {formatCurrency(totals.invoiceDiscount, settings.currency)}
                      </div>
                    </div>
                  ) : null}
                  <div className="border-t border-neutral-200 dark:border-neutral-800 my-2" />
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-sm text-neutral-600 dark:text-neutral-300">Subtotal</div>
                    <div className="text-sm font-medium">
                      {formatCurrency(totals.taxable, settings.currency)}
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Custom footer (always shown, also in PDF) */}
        <div className="mt-8 text-xs text-neutral-700 dark:text-neutral-300 text-center">
          {settings.invoiceFooter || DEFAULTS.settings.invoiceFooter}
        </div>
        {!printing ? (
          <div className="mt-2 text-[10px] text-neutral-400 text-center">
            Dibuat dengan ILoveInvoice
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const InvoicePreview = memo(InvoicePreviewInner);

