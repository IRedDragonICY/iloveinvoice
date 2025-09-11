interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

export function TextField({ label, value, onChange, type = "text" }: TextFieldProps) {
  return (
    <label className="block">
      <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 px-3.5 py-2.5 text-sm outline-none focus:ring-4 focus:ring-neutral-900/5 dark:focus:ring-white/5"
      />
    </label>
  );
}

