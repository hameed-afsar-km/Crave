import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

export function getCloudinary() {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export async function uploadToCloudinary(
  file: File | Buffer,
  folder = 'crave',
  filename?: string,
): Promise<{ url: string; publicId: string }> {
  const isServer = typeof window === 'undefined';

  if (!isServer) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'crave_unsigned');
    formData.append('folder', folder);
    if (filename) formData.append('public_id', filename);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Cloudinary upload failed');
    }

    const data = await res.json();
    return { url: data.secure_url, publicId: data.public_id };
  }

  // Server-side: use SDK
  const cld = getCloudinary();
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!);
      },
    );

    if (Buffer.isBuffer(file)) {
      uploadStream.end(file);
    } else {
      file.arrayBuffer().then((buf) => uploadStream.end(Buffer.from(buf)));
    }
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cld = getCloudinary();
  await cld.uploader.destroy(publicId);
}

export function getCloudinaryUrl(publicId: string, options?: Record<string, string | number>): string {
  const cld = getCloudinary();
  return cld.url(publicId, {
    secure: true,
    transformation: [{ quality: 'auto', format: 'auto' }],
    ...options,
  });
}
