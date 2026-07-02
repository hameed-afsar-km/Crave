function stripHTML(input: string): string {
  return input.replace(/[<>&"'`]/g, '');
}

export function sanitizeString(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return stripHTML(input).trim().slice(0, maxLength);
}

export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.replace(/[^0-9+\-\s()]/g, '').trim().slice(0, 20);
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length > 0 && digits.length < 10) return '';
  if (digits.length > 15) return '';
  return cleaned;
}

export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.replace(/[^a-zA-Z0-9@._+\-]/g, '').trim().slice(0, 254);
  if (cleaned.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) return '';
  }
  return cleaned;
}

export function sanitizeItemName(input: string): string {
  if (typeof input !== 'string') return '';
  return stripHTML(input).trim().slice(0, 100);
}

export function sanitizeDisplayName(input: string): string {
  if (typeof input !== 'string') return '';
  return stripHTML(input).replace(/[0-9]/g, '').trim().slice(0, 100);
}

export function sanitizeAddress(input: string): string {
  if (typeof input !== 'string') return '';
  return stripHTML(input).trim().slice(0, 500);
}

export function sanitizeUserProfile(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') {
      out[key] = value;
      continue;
    }
    switch (key) {
      case 'name':
      case 'displayName':
        out[key] = sanitizeDisplayName(value);
        break;
      case 'phone':
        out[key] = sanitizePhone(value);
        break;
      case 'email':
        out[key] = sanitizeEmail(value);
        break;
      case 'address':
        out[key] = sanitizeAddress(value);
        break;
      default:
        out[key] = sanitizeString(value, 500);
    }
  }
  return out;
}
