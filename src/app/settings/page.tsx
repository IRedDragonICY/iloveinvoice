import type { Metadata } from 'next';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = {
  title: 'Pengaturan - ILoveInvoice',
  description: 'Konfigurasi tema, format mata uang, pajak, dan pengaturan lainnya untuk ILoveInvoice',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
