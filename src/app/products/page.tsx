import type { Metadata } from 'next';
import { ProductsClient } from './ProductsClient';

export const metadata: Metadata = {
  title: 'Produk - ILoveInvoice',
  description: 'Kelola katalog produk Anda - Tambah, edit, dan hapus produk untuk memudahkan pembuatan invoice',
};

export default function ProductsPage() {
  return <ProductsClient />;
}
