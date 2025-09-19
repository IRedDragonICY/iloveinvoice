import type { Metadata } from 'next';
import { HistoryDetailClient } from './HistoryDetailClient';

type Params = { id: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `History - Invoice ${id} - ILoveInvoice`,
    description: `Lihat detail dan preview invoice ${id} dari riwayat`,
  };
}

export default async function HistoryDetailPage(
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  return <HistoryDetailClient invoiceId={id} />;
}
