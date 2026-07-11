import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/firebase-admin';
import { rateLimit } from '@/lib/rate-limiter';
import { uploadToCloudinaryServer } from '@/lib/cloudinary-admin';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 4096;

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  'image/avif': [new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])],
};

function bytesMatch(data: Uint8Array, signature: Uint8Array): boolean {
  if (data.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) return false;
  }
  return true;
}

function validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const data = new Uint8Array(buffer.slice(0, 16));
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) => bytesMatch(data, sig));
}

function validateExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isExecutableContent(buffer: ArrayBuffer): boolean {
  const data = new Uint8Array(buffer.slice(0, 4));
  const executableSignatures = [
    new Uint8Array([0x4D, 0x5A]),
    new Uint8Array([0x7F, 0x45, 0x4C, 0x46]),
    new Uint8Array([0xCA, 0xFE, 0xBA, 0xBE]),
    new Uint8Array([0xCF, 0xFA, 0xED, 0xFE]),
    new Uint8Array([0xFF, 0xFB]),
  ];
  return executableSignatures.some((sig) => bytesMatch(data, sig));
}

function getImageDimensions(buffer: ArrayBuffer, mimeType: string): { width: number; height: number } | null {
  const data = new Uint8Array(buffer);
  try {
    if (mimeType === 'image/jpeg') {
      let offset = 2;
      while (offset + 9 < data.length) {
        if (data[offset] === 0xFF && data[offset + 1] === 0xC0) {
          return {
            height: (data[offset + 5] << 8) | data[offset + 6],
            width: (data[offset + 7] << 8) | data[offset + 8],
          };
        }
        offset += 2 + ((data[offset + 2] << 8) | data[offset + 3]);
      }
    }
    if (mimeType === 'image/png') {
      if (data.length >= 24) {
        return {
          width: (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19],
          height: (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23],
        };
      }
    }
    if (mimeType === 'image/webp') {
      if (data.length >= 30 && data[12] === 0x56 && data[13] === 0x50 && data[14] === 0x38) {
        if (data[15] === 0x20) {
          return {
            width: ((data[24] & 0x3F) << 8) | data[23],
            height: ((data[26] & 0x3F) << 8) | data[25],
          };
        }
        if (data[15] === 0x4C) {
          return {
            width: ((data[24] & 0x3F) << 8) | data[23],
            height: ((data[26] & 0x3F) << 8) | data[25],
          };
        }
      }
    }
    if (mimeType === 'image/avif') {
      return { width: 0, height: 0 };
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireStaff(req);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden: staff role required' }, { status: 403 });
    }

    const rl = rateLimit(`upload:${auth.uid}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetIn}s` },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: `Invalid file type: ${mimeType}` }, { status: 400 });
    }

    if (!validateExtension(file.name)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();

    if (isExecutableContent(buffer)) {
      return NextResponse.json({ error: 'Executable content detected' }, { status: 400 });
    }

    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json({ error: 'File content does not match expected format' }, { status: 400 });
    }

    const dimensions = getImageDimensions(buffer, mimeType);
    if (dimensions) {
      if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
        return NextResponse.json({ error: 'Image dimensions exceed 4096px' }, { status: 400 });
      }
    }

    const result = await uploadToCloudinaryServer(Buffer.from(buffer), 'crave/menu-items');

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      mimeType,
      size: file.size,
      dimensions,
    });
  } catch (err: unknown) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
