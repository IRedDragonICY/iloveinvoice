/**
 * Image compression and utility functions
 * Handles large images that would exceed localStorage limits
 */

export interface ImageCompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface ImageProcessResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file to reduce its size for localStorage storage
 * @param file The image file to compress
 * @param options Compression options
 * @returns Promise with compressed image data URL and metadata
 */
export async function compressImage(
  file: File,
  options: ImageCompressOptions = {}
): Promise<ImageProcessResult> {
  const {
    maxWidth = 800,
    maxHeight = 400,
    quality = 0.8,
    maxSizeKB = 500,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels if needed
      let compressedDataUrl: string;
      let currentQuality = quality;
      const originalSize = estimate64Size(file.size);

      do {
        compressedDataUrl = canvas.toDataURL(`image/${format}`, currentQuality);
        const compressedSize = estimate64Size(compressedDataUrl.length);

        // If size is acceptable, use it
        if (compressedSize <= maxSizeKB * 1024) {
          resolve({
            dataUrl: compressedDataUrl,
            originalSize: file.size,
            compressedSize,
            compressionRatio: (file.size / compressedSize)
          });
          return;
        }

        // Reduce quality and try again
        currentQuality *= 0.8;
      } while (currentQuality > 0.1);

      // If still too large, reject
      const finalSize = estimate64Size(compressedDataUrl.length);
      if (finalSize > maxSizeKB * 1024) {
        reject(new Error(`Image still too large after compression: ${Math.round(finalSize / 1024)}KB`));
      } else {
        resolve({
          dataUrl: compressedDataUrl,
          originalSize: file.size,
          compressedSize: finalSize,
          compressionRatio: (file.size / finalSize)
        });
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Estimate the size of a base64 string in bytes
 */
function estimate64Size(base64Length: number): number {
  return Math.ceil(base64Length * 0.75);
}

/**
 * Check if localStorage has enough space for the data
 */
export function checkLocalStorageSpace(dataSize: number): boolean {
  try {
    // Get current localStorage usage
    let currentSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        currentSize += localStorage[key].length + key.length;
      }
    }

    // Typical localStorage limit is 5-10MB, we'll use 5MB as conservative estimate
    const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB
    return (currentSize + dataSize) < STORAGE_LIMIT;
  } catch {
    return false;
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate if file is a valid image format
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}
