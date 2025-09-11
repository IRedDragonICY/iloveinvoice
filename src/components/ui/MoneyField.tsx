import { useState, useEffect } from 'react';
import { formatCurrency, parseNumber } from '@/lib/utils';
import type { Settings } from '@/lib/types';

interface MoneyFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  currency: Settings["currency"];
}

export function MoneyField({ label, value, onChange, currency }: MoneyFieldProps) {
  const [raw, setRaw] = useState(String(value || 0));
  
  useEffect(() => {
    setRaw(String(value ?? 0));
  }, [value]);
  
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <input
        inputMode="decimal"
        type="text"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          onChange(parseNumber(e.target.value));
        }}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
        placeholder={formatCurrency(0, currency)}
      />
    </label>
  );
}

