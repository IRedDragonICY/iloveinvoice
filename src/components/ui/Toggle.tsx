import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "h-7 w-12 rounded-full relative transition border",
        checked
          ? "bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white"
          : "bg-neutral-200 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 h-5 w-5 rounded-full bg-white dark:bg-neutral-900 transition",
          checked ? "translate-x-5" : "translate-x-0",
          "shadow"
        )}
      />
    </button>
  );
}

