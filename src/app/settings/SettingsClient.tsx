'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, SelectField, NumberField, TextField, Toggle } from '@/components/ui';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { usePersistentState } from '@/hooks/usePersistentState';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import { parseNumber, cn } from '@/lib/utils';
import type { Settings, ThemeMode, AccentKey } from '@/lib/types';

export function SettingsClient() {
  const [settings, setSettings] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const accent = ACCENT_MAP[settings.accent];

  return (
    <PageWrapper>
      <Card>
        <div className="text-sm font-medium mb-3">Tema</div>
        <div className="grid grid-cols-3 gap-2">
          {(["system", "light", "dark"] as ThemeMode[]).map((t) => (
            <motion.button
              whileTap={{ scale: 0.98 }}
              key={t}
              onClick={() => setSettings({ ...settings, theme: t })}
              className={cn(
                "py-2 rounded-xl border text-sm transition",
                settings.theme === t
                  ? cn(accent.softBg, "border-transparent")
                  : "border-neutral-200 dark:border-neutral-800"
              )}
            >
              {t === "system" ? "System" : t === "light" ? "Light" : "Dark"}
            </motion.button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-3">Aksen Warna</div>
        <div className="flex items-center gap-2">
          {(["indigo", "emerald", "sky", "amber", "rose", "violet", "neutral"] as AccentKey[]).map(
            (key) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={key}
                aria-label={key}
                onClick={() => setSettings({ ...settings, accent: key })}
                className={cn(
                  "h-9 w-9 rounded-full border transition grid place-items-center",
                  key === "neutral"
                    ? "bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                    : "border-transparent",
                  ACCENT_MAP[key].solid
                )}
              >
                {settings.accent === key ? (
                  <Check className="w-5 h-5 text-white" />
                ) : null}
              </motion.button>
            )
          )}
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-3">Format & Pajak</div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Currency"
            value={settings.currency}
            onChange={(v) =>
              setSettings({ ...settings, currency: v as Settings["currency"] })
            }
            options={[
              { label: "IDR (Rp)", value: "IDR" },
              { label: "USD ($)", value: "USD" },
              { label: "EUR (€)", value: "EUR" },
              { label: "SGD ($)", value: "SGD" },
              { label: "JPY (¥)", value: "JPY" },
            ]}
          />
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between">
            <div className="text-sm">Aktifkan Pajak</div>
            <Toggle
              checked={settings.showTax}
              onChange={(v) => setSettings({ ...settings, showTax: v })}
            />
          </div>
          <NumberField
            label="Pajak % (invoice)"
            value={String(settings.taxPercent ?? 0)}
            onChange={(v) =>
              setSettings({
                ...settings,
                taxPercent: Math.max(0, parseNumber(v)),
              })
            }
          />
          <TextField
            label="Footer Invoice"
            value={settings.invoiceFooter ?? DEFAULTS.settings.invoiceFooter}
            onChange={(v) => setSettings({ ...settings, invoiceFooter: v })}
          />
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Pajak dihitung dari subtotal setelah semua diskon. Footer akan tampil di bagian bawah invoice.
        </div>
      </Card>
    </PageWrapper>
  );
}
