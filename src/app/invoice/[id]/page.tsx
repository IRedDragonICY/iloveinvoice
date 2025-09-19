import type { Metadata } from 'next';
import { InvoiceDetailClient } from './InvoiceDetailClient';

type Params = { id: string };

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Invoice ${id} - ILoveInvoice`,
    description: `Edit dan kelola invoice ${id} - Generator invoice online gratis`,
  };
}

export default async function InvoiceDetailPage(
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  return <InvoiceDetailClient invoiceId={id} />;
}
