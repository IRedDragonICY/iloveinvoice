import type { Metadata } from 'next';
import { HistoryClient } from './HistoryClient';

export const metadata: Metadata = {
  title: 'Riwayat Invoice - ILoveInvoice',
  description: 'Lihat, kelola, dan ekspor riwayat invoice Anda - Cari, duplikat, dan print invoice lama',
};

export default function HistoryPage() {
  return <HistoryClient />;
}
