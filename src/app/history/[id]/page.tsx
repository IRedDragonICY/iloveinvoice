import type { Metadata } from 'next';
import { HistoryDetailClient } from './HistoryDetailClient';

interface HistoryDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: HistoryDetailPageProps): Promise<Metadata> {
  return {
    title: `History - Invoice ${params.id} - ILoveInvoice`,
    description: `Lihat detail dan preview invoice ${params.id} dari riwayat`,
  };
}

export default function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  return <HistoryDetailClient invoiceId={params.id} />;
}
