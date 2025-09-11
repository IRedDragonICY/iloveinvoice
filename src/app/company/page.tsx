import type { Metadata } from 'next';
import { CompanyClient } from './CompanyClient';

export const metadata: Metadata = {
  title: 'Perusahaan - ILoveInvoice',
  description: 'Kelola profil perusahaan Anda - Logo, nama, alamat, dan kontak untuk invoice',
};

export default function CompanyPage() {
  return <CompanyClient />;
}
