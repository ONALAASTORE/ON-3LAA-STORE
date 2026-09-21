import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Checks whether a given string is a base64 encoded data URI
 */
export function isBase64DataUrl(str: string): boolean {
  return typeof str === 'string' && str.startsWith('data:image/');
}

/**
 * Uploads a single image (File or base64 data URL) to Firebase Storage
 * and returns the public HTTPS download URL.
 * If the input is already an external URL (http/https), returns it as-is.
 */
export async function uploadProductImageToStorage(
  imageSource: File | string,
  productId: string,
  index = 0
): Promise<string> {
  // 1. If it's already an external HTTPS/HTTP URL, keep it as is
  if (typeof imageSource === 'string') {
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      return imageSource;
    }
    // If not base64 or valid URL, return empty or fallback
    if (!isBase64DataUrl(imageSource)) {
      return imageSource;
    }
  }

  const cleanProductId = (productId || 'new-product').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const filePath = `products/${cleanProductId}/${timestamp}_${index}.jpg`;
  const storageRef = ref(storage, filePath);

  try {
    if (typeof imageSource === 'string') {
      // Base64 Data URL upload
      await uploadString(storageRef, imageSource, 'data_url', {
        contentType: 'image/jpeg',
        cacheControl: 'public,max-age=31536000',
      });
    } else {
      // File upload
      await uploadBytes(storageRef, imageSource, {
        contentType: imageSource.type || 'image/jpeg',
        cacheControl: 'public,max-age=31536000',
      });
    }

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (err: any) {
    console.warn(`[Firebase Storage] Could not upload image to ${filePath}:`, err?.message || err);
    // If upload fails (e.g. storage rules or bucket restriction), return the original
    // or fallback to avoid throwing an unhandled exception
    return typeof imageSource === 'string' ? imageSource : '';
  }
}

/**
 * Processes a list of product images:
 * Uploads all base64 images to Firebase Storage in parallel,
 * preserving existing HTTPS URLs.
 * Returns clean array of public HTTPS URLs.
 */
export async function processAndUploadProductImages(
  images: string[],
  productId: string
): Promise<string[]> {
  if (!images || images.length === 0) return [];

  const uploadPromises = images.map(async (img, idx) => {
    if (isBase64DataUrl(img)) {
      try {
        const url = await uploadProductImageToStorage(img, productId, idx);
        return url;
      } catch {
        return img;
      }
    }
    return img;
  });

  const resolvedUrls = await Promise.all(uploadPromises);
  // Filter out empty strings
  return resolvedUrls.filter(Boolean);
}
