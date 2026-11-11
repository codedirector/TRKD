import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

let isConfigured = false;
let cloudinaryAuthFailed = false;

export function getCloudinaryClient() {
  if (cloudinaryAuthFailed) {
    return null;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();

  if (cloudinaryUrl) {
    cloudinary.config({ url: cloudinaryUrl });
    isConfigured = true;
    return cloudinary;
  }

  // Cloudinary API secrets are standard 27-28 character hex/alphanumeric strings
  if (cloudName && apiKey && apiSecret && apiSecret.length >= 16) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    isConfigured = true;
    return cloudinary;
  }

  return null;
}

export function isCloudinaryConfigured(): boolean {
  if (cloudinaryAuthFailed) return false;
  if (process.env.CLOUDINARY_URL?.trim()) return true;

  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    secret &&
    secret.length >= 16
  );
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

/**
 * Uploads a local file (such as a PDF resume or candidate image) to Cloudinary.
 * Falls back safely to local disk storage if Cloudinary credentials are not configured or invalid.
 */
export async function uploadToCloudinary(
  filePath: string,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'auto' | 'raw' | 'image';
  } = {}
): Promise<CloudinaryUploadResult | null> {
  if (cloudinaryAuthFailed || !isCloudinaryConfigured()) {
    return null;
  }

  const client = getCloudinaryClient();
  if (!client) {
    return null;
  }

  try {
    const result = await client.uploader.upload(filePath, {
      folder: options.folder || 'trackd/resumes',
      public_id: options.publicId,
      resource_type: options.resourceType || 'auto',
      overwrite: true,
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    // If credentials are invalid, disabled, or failed, switch permanently to local disk storage fallback
    cloudinaryAuthFailed = true;
    const msg = error?.message || (typeof error === 'string' ? error : 'Upload error');
    console.warn(`[Cloudinary] Remote storage unavailable (${msg}). Using local disk storage fallback.`);
    return null;
  }
}
