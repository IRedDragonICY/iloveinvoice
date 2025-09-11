interface TextAreaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}

export function TextArea({ label, value, onChange, rows = 3 }: TextAreaProps) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
      />
    </label>
  );
}

