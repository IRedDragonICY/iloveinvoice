import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { TextField, TextArea, MoneyField } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Product, Settings } from '@/lib/types';

interface ProductRowProps {
  product: Product;
  currency: Settings["currency"];
  onChange: (p: Product) => void;
  onDelete: () => void;
}

function ProductRowInner({ product, currency, onChange, onDelete }: ProductRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Product>(product);
  
  useEffect(() => setDraft(product), [product]);
  
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
      {editing ? (
        <div className="grid grid-cols-1 gap-3">
          <TextField
            label="Nama Produk"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <TextArea
            label="Deskripsi"
            value={draft.description || ""}
            onChange={(v) => setDraft({ ...draft, description: v })}
            rows={2}
          />
          <div className="grid grid-cols-1 gap-3">
            <MoneyField
              label="Harga"
              value={draft.price}
              onChange={(v) => setDraft({ ...draft, price: v })}
              currency={currency}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditing(false);
                setDraft(product);
              }}
              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
            >
              Batal
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onChange(draft);
                setEditing(false);
              }}
              className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
            >
              Simpan
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{product.name}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {product.description}
            </div>
            <div className="mt-1 inline-flex items-center gap-2">
              <span className="text-xs font-medium">
                {formatCurrency(product.price, currency)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setEditing(true)}
              className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800"
            >
              <Pencil className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onDelete}
              className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

export const ProductRow = memo(ProductRowInner, (prev, next) => {
  return (
    prev.currency === next.currency &&
    prev.product.id === next.product.id &&
    prev.product.name === next.product.name &&
    prev.product.description === next.product.description &&
    prev.product.price === next.product.price
  );
});

