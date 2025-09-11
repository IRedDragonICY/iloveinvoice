import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { TextField, TextArea, MoneyField } from '@/components/ui';
import { generateId, cn } from '@/lib/utils';
import type { Product, AccentConfig } from '@/lib/types';

interface ProductEditorProps {
  accent: AccentConfig;
  onSave: (product: Product) => void;
}

export function ProductEditor({ accent, onSave }: ProductEditorProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState<number>(0);

  function reset() {
    setName("");
    setDesc("");
    setPrice(0);
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <TextField label="Nama Produk" value={name} onChange={setName} />
      <TextArea label="Deskripsi" value={desc} onChange={setDesc} rows={2} />
      <div className="grid grid-cols-1 gap-3">
        <MoneyField label="Harga" value={price} onChange={setPrice} currency="IDR" />
      </div>
      <div className="flex items-center justify-end">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (!name.trim()) return;
            const p: Product = {
              id: generateId("prd"),
              name,
              description: desc,
              price,
            };
            onSave(p);
            reset();
          }}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm shadow-sm transition",
            accent.solid,
            accent.solidHover
          )}
        >
          <Plus className="w-4 h-4 text-white" />
          Simpan Produk
        </motion.button>
      </div>
    </div>
  );
}

