'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type { TabKey } from '@/lib/types';

const routeMap: Record<TabKey, string> = {
  invoice: '/invoice',
  products: '/products', 
  company: '/company',
  history: '/history',
  settings: '/settings'
};

const pathMap: Record<string, TabKey> = {
  '/': 'invoice', // Default route
  '/invoice': 'invoice',
  '/products': 'products',
  '/company': 'company', 
  '/history': 'history',
  '/settings': 'settings'
};

export function useAppNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = useMemo((): TabKey => {
    // Handle dynamic routes
    if (pathname.startsWith('/invoice')) return 'invoice';
    if (pathname.startsWith('/history')) return 'history';
    
    // Handle exact matches
    return pathMap[pathname] || 'invoice';
  }, [pathname]);

  const navigateToTab = (tab: TabKey) => {
    const route = routeMap[tab];
    if (route) {
      router.push(route);
    }
  };

  const navigateToInvoice = (invoiceId: string) => {
    router.push(`/invoice/${invoiceId}`);
  };

  const navigateToNewInvoice = () => {
    router.push('/invoice/new');
  };

  const navigateToHistoryItem = (invoiceId: string) => {
    router.push(`/history/${invoiceId}`);
  };

  return {
    activeTab,
    navigateToTab,
    navigateToInvoice,
    navigateToNewInvoice,
    navigateToHistoryItem,
    pathname,
    router
  };
}
