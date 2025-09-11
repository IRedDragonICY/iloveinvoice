'use client';

import { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, TextField, TextArea, Toggle } from '@/components/ui';
import { PageWrapper } from '@/components/shared/PageWrapper';
import { usePersistentState } from '@/hooks/usePersistentState';
import { STORAGE, DEFAULTS, ACCENT_MAP } from '@/lib/constants';
import { compressImage, formatFileSize, isValidImageFile, checkLocalStorageSpace } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import type { Company, Settings } from '@/lib/types';

export function CompanyClient() {
  const [settings, setSettings] = usePersistentState<Settings>(STORAGE.settings, DEFAULTS.settings);
  const [company, setCompany, , companyError] = usePersistentState<Company>(STORAGE.company, DEFAULTS.company);
  
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const accent = ACCENT_MAP[settings.accent];

  function triggerToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function onLogoChange(file?: File | null) {
    if (!file) {
      setCompany({ ...company, logoDataUrl: "" });
      setImageError(null);
      return;
    }

    // Validate file type
    if (!isValidImageFile(file)) {
      setImageError("Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.");
      return;
    }

    // Check file size (warn if over 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("File terlalu besar (>5MB). Gambar akan dikompres otomatis.");
      // Continue processing with compression
    } else {
      setImageError(null);
    }

    setImageUploading(true);
    
    try {
      // Compress the image before saving
      const result = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 400,
        quality: 0.8,
        maxSizeKB: 500, // Target 500KB or less
        format: 'webp'
      });

      // Check if localStorage can handle this size
      if (!checkLocalStorageSpace(result.compressedSize)) {
        throw new Error('Storage penuh. Coba hapus data lama atau gunakan gambar yang lebih kecil.');
      }

      // Update company with compressed image
      setCompany({ ...company, logoDataUrl: result.dataUrl });
      
      // Show success message with compression info
      const compressionInfo = result.compressionRatio > 1.5 
        ? ` (dikompres ${result.compressionRatio.toFixed(1)}x dari ${formatFileSize(result.originalSize)})`
        : '';
      
      triggerToast(`Logo berhasil disimpan${compressionInfo}`);
      setImageError(null);

    } catch (error) {
      console.error('Logo upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memproses gambar';
      setImageError(errorMessage);
      triggerToast(`Error: ${errorMessage}`);
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <PageWrapper>
      <Card>
        <div className="text-sm font-medium mb-3">Profil Perusahaan</div>
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <div className="max-w-[220px] max-h-16 rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-neutral-900 flex items-center justify-center p-1 relative">
              {imageUploading ? (
                <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className={cn("w-5 h-5 animate-spin", accent.text)} />
                    <div className="text-[10px] text-neutral-500">Memproses...</div>
                  </div>
                </div>
              ) : null}
              {company.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoDataUrl}
                  alt="Logo"
                  className="max-h-16 w-auto object-contain"
                />
              ) : (
                <Building2 className="w-7 h-7 text-neutral-400" />
              )}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <label className="col-span-2">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Logo Perusahaan</div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onLogoChange(e.target.files?.[0])}
                  disabled={imageUploading}
                  className={cn(
                    "block w-full text-xs text-neutral-600 dark:text-neutral-300 file:mr-3 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:text-white file:cursor-pointer file:bg-neutral-900 hover:file:bg-black dark:file:bg-white dark:file:text-neutral-900 dark:hover:file:bg-neutral-200",
                    imageUploading && "opacity-50 pointer-events-none"
                  )}
                />
                {company.logoDataUrl && !imageUploading ? (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onLogoChange(null)}
                    className="text-xs px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800"
                  >
                    Hapus
                  </motion.button>
                ) : null}
              </div>
              {imageError && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                  {imageError}
                </div>
              )}
              {companyError?.type === 'quota_exceeded' && (
                <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-2 py-1">
                  {companyError.message}
                </div>
              )}
              <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                💡 Gambar besar akan dikompres otomatis untuk menghemat storage. 
                Format yang didukung: JPG, PNG, GIF, WebP.
              </div>
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 gap-3">
          <TextField
            label="Nama Perusahaan"
            value={company.name}
            onChange={(v) => setCompany({ ...company, name: v })}
          />
          <TextArea
            label="Alamat Perusahaan"
            rows={3}
            value={company.address}
            onChange={(v) => setCompany({ ...company, address: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="No. Telp Perusahaan"
              value={company.phone || ""}
              onChange={(v) => setCompany({ ...company, phone: v })}
            />
            <TextField
              label="Email Perusahaan"
              type="email"
              value={company.email || ""}
              onChange={(v) => setCompany({ ...company, email: v })}
            />
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
              Visibilitas Kontak di Invoice
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="text-sm">Tampilkan No. Telp</div>
              <Toggle
                checked={settings.showCompanyPhone}
                onChange={(val) => setSettings({ ...settings, showCompanyPhone: val })}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="text-sm">Tampilkan Email</div>
              <Toggle
                checked={settings.showCompanyEmail}
                onChange={(val) => setSettings({ ...settings, showCompanyEmail: val })}
              />
            </div>
          </div>
        </div>
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
