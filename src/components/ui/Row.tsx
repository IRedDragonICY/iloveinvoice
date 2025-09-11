import { cn } from '@/lib/utils';

interface RowProps {
  label: string;
  value: string;
  strong?: boolean;
}

export function Row({ label, value, strong }: RowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-neutral-600 dark:text-neutral-300">{label}</div>
      <div className={cn("text-sm", strong ? "font-semibold" : "font-medium")}>{value}</div>
    </div>
  );
}

