import type { Metadata } from 'next';
import { NewInvoiceClient } from './NewInvoiceClient';

export const metadata: Metadata = {
  title: 'Invoice Baru - ILoveInvoice',
  description: 'Buat invoice baru - Generator invoice online gratis dengan fitur lengkap',
};

export default function NewInvoicePage() {
  return <NewInvoiceClient />;
}
