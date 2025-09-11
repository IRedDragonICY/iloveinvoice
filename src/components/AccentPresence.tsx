// This component ensures all accent classes are included in the build
// by referencing them, preventing Tailwind CSS purging
export function AccentPresence() {
  return (
    <div className="hidden">
      <div className="bg-indigo-600 hover:bg-indigo-700 bg-indigo-50 text-indigo-600 focus-visible:ring-indigo-500 bg-indigo-600/10 text-indigo-700 dark:text-indigo-300" />
      <div className="bg-emerald-600 hover:bg-emerald-700 bg-emerald-50 text-emerald-600 focus-visible:ring-emerald-500 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300" />
      <div className="bg-sky-600 hover:bg-sky-700 bg-sky-50 text-sky-600 focus-visible:ring-sky-500 bg-sky-600/10 text-sky-700 dark:text-sky-300" />
      <div className="bg-amber-600 hover:bg-amber-700 bg-amber-50 text-amber-600 focus-visible:ring-amber-500 bg-amber-600/10 text-amber-700 dark:text-amber-300" />
      <div className="bg-rose-600 hover:bg-rose-700 bg-rose-50 text-rose-600 focus-visible:ring-rose-500 bg-rose-600/10 text-rose-700 dark:text-rose-300" />
      <div className="bg-violet-600 hover:bg-violet-700 bg-violet-50 text-violet-600 focus-visible:ring-violet-500 bg-violet-600/10 text-violet-700 dark:text-violet-300" />
      <div className="bg-neutral-800 hover:bg-neutral-900 bg-neutral-100 text-neutral-700 focus-visible:ring-neutral-500 bg-neutral-700/10 text-neutral-700 dark:text-neutral-300" />
    </div>
  );
}

