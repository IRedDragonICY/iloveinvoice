'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui';
import { ProductEditor } from '@/components/product/ProductEditor';
import { ProductRow } from '@/components/product/ProductRow';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useDebounced } from '@/hooks/useDebounced';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import type { Product, Settings } from '@/lib/types';

export function ProductsClient() {
  const [settings] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [products, setProducts] = usePersistentState<Product[]>(STORAGE.products, DEFAULTS.products);
  const [productQuery, setProductQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  
  const debouncedProductQuery = useDebounced(productQuery, 200);
  const accent = ACCENT_MAP[settings.accent];

  function triggerToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const filteredProducts = useMemo(() => {
    const q = debouncedProductQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [products, debouncedProductQuery]);

  return (
    <PageWrapper>
      <Card>
        <div className="text-sm font-medium mb-3">Tambah Produk</div>
        <ProductEditor
          accent={accent}
          onSave={(p) => {
            setProducts((prev) => [p, ...prev]);
            triggerToast("Produk ditambahkan");
          }}
        />
      </Card>

      <Card>
        <div className="text-sm font-medium">Daftar Produk</div>
        <div className="mt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Cari produk…"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
            />
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4 text-center">
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Tidak ada produk yang cocok.
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {filteredProducts.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                currency={settings.currency}
                onChange={(np) => {
                  setProducts((prev) => prev.map((x) => (x.id === p.id ? np : x)));
                }}
                onDelete={() => {
                  setProducts((prev) => prev.filter((x) => x.id !== p.id));
                  triggerToast("Produk dihapus");
                }}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 inset-x-0 z-50">
          <div className="mx-auto max-w-2xl px-4">
            <div className="px-4 py-2 rounded-full text-sm text-white shadow-lg bg-neutral-900/90 dark:bg-white/90 dark:text-neutral-900 w-fit mx-auto">
              {toast}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
