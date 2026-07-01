const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  'image/webp': [
    new Uint8Array([0x52, 0x49, 0x46, 0x46]), // RIFF
  ],
  'image/avif': [
    new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]), // ftyp
  ],
};

function bytesMatch(data: Uint8Array, signature: Uint8Array): boolean {
  if (data.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) return false;
  }
  return true;
}

function isWebP(data: Uint8Array): boolean {
  if (!bytesMatch(data, MAGIC_BYTES['image/webp'][0])) return false;
  // Check WEBP at offset 8
  if (data.length < 12) return false;
  const webpSig = new Uint8Array([0x57, 0x45, 0x42, 0x50]);
  return data[8] === webpSig[0] && data[9] === webpSig[1] && data[10] === webpSig[2] && data[11] === webpSig[3];
}

function isAVIF(data: Uint8Array): boolean {
  if (!bytesMatch(data, MAGIC_BYTES['image/avif'][0])) return false;
  // Check 'avif' in ftyp box at offset 8
  if (data.length < 12) return false;
  const avifSig = new Uint8Array([0x61, 0x76, 0x69, 0x66]);
  return data[8] === avifSig[0] && data[9] === avifSig[1] && data[10] === avifSig[2] && data[11] === avifSig[3];
}

export async function validateImageMagicBytes(file: File): Promise<{ valid: boolean; error?: string }> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const data = new Uint8Array(buffer);

    switch (file.type) {
      case 'image/jpeg':
        if (!bytesMatch(data, MAGIC_BYTES['image/jpeg'][0])) {
          return { valid: false, error: 'File is not a valid JPEG (magic bytes mismatch)' };
        }
        break;
      case 'image/png':
        if (!bytesMatch(data, MAGIC_BYTES['image/png'][0])) {
          return { valid: false, error: 'File is not a valid PNG (magic bytes mismatch)' };
        }
        break;
      case 'image/webp':
        if (!isWebP(data)) {
          return { valid: false, error: 'File is not a valid WebP (magic bytes mismatch)' };
        }
        break;
      case 'image/avif':
        if (!isAVIF(data)) {
          return { valid: false, error: 'File is not a valid AVIF (magic bytes mismatch)' };
        }
        break;
      default:
        return { valid: false, error: `Unsupported file type: ${file.type}` };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Unable to read file' };
  }
}
