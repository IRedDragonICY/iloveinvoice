import type { Metadata } from 'next';
import { InvoiceClient } from './InvoiceClient';

export const metadata: Metadata = {
  title: 'Invoice Editor - ILoveInvoice',
  description: 'Buat dan edit invoice dengan mudah - Generator invoice online gratis dengan fitur lengkap',
};

export default function InvoicePage() {
  return <InvoiceClient />;
}
