import type { Metadata } from 'next';
import { InvoiceDetailClient } from './InvoiceDetailClient';

interface InvoiceDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: InvoiceDetailPageProps): Promise<Metadata> {
  return {
    title: `Invoice ${params.id} - ILoveInvoice`,
    description: `Edit dan kelola invoice ${params.id} - Generator invoice online gratis`,
  };
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  return <InvoiceDetailClient invoiceId={params.id} />;
}
