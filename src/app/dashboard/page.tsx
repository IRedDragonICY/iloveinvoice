import type { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard - ILoveInvoice',
  description: 'Overview dashboard untuk ILoveInvoice - Kelola invoice, produk, dan perusahaan Anda',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
