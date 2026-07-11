import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

let configured = false;

function getConfiguredCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: API_KEY,
      api_secret: API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export async function uploadToCloudinaryServer(
  file: Buffer,
  folder = 'crave',
  filename?: string,
): Promise<{ url: string; publicId: string }> {
  const cld = getConfiguredCloudinary();
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
    uploadStream.end(file);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cld = getConfiguredCloudinary();
  await cld.uploader.destroy(publicId);
}
