const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

export async function uploadToCloudinary(
  file: File,
  folder = 'crave',
  filename?: string,
): Promise<{ url: string; publicId: string }> {
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

export function getCloudinaryImageUrl(publicId: string, options?: Record<string, string | number>): string {
  const transforms = Object.entries(options || {})
    .map(([k, v]) => `${k}_${v}`)
    .join(',');

  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  const transformStr = transforms ? `/${transforms}` : '';
  return `${base}${transformStr}/${publicId}`;
}
