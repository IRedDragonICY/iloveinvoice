'use client';

import { Card } from '@/components/ui';
import { PageWrapper } from '@/components/shared/PageWrapper';

export function DashboardClient() {
  return (
    <PageWrapper>
      <Card>
        <div className="space-y-2">
          <div className="text-sm font-medium">Dashboard</div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Selamat datang di ILoveInvoice. Fitur dashboard akan hadir segera.
          </p>
        </div>
      </Card>
    </PageWrapper>
  );
}
