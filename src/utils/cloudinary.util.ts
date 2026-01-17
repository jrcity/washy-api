/**
 * Cloudinary Utility
 * Configuration and helper functions for Cloudinary uploads
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import { EUPLOAD_CATEGORY } from '@/constants/enums.constant';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Base folder for all uploads
const BASE_FOLDER = process.env.CLOUDINARY_FOLDER || 'washy';

// Folder mapping for different upload categories
const CATEGORY_FOLDERS: Record<EUPLOAD_CATEGORY, string> = {
  [EUPLOAD_CATEGORY.SERVICE_IMAGE]: 'services',
  [EUPLOAD_CATEGORY.CATEGORY_IMAGE]: 'categories',
  [EUPLOAD_CATEGORY.PICKUP_SCREENSHOT]: 'orders/pickup',
  [EUPLOAD_CATEGORY.DELIVERY_SCREENSHOT]: 'orders/delivery',
  [EUPLOAD_CATEGORY.PROOF_PHOTO]: 'orders/proofs',
  [EUPLOAD_CATEGORY.OTHER]: 'misc'
};

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  category: EUPLOAD_CATEGORY
): Promise<UploadResult> {
  const folder = `${BASE_FOLDER}/${CATEGORY_FOLDERS[category]}`;
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }
        
        if (!result) {
          reject(new Error('Cloudinary upload failed: No result returned'));
          return;
        }
        
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          size: result.bytes
        });
      }
    );
    
    // Convert buffer to stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleFromCloudinary(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;
  
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error);
  }
}

/**
 * Get folder path for an upload category
 */
export function getCategoryFolder(category: EUPLOAD_CATEGORY): string {
  return `${BASE_FOLDER}/${CATEGORY_FOLDERS[category]}`;
}

export default cloudinary;
