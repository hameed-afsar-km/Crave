export function sanitizeString(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>&"'`]/g, '') // strip HTML special chars
    .trim()
    .slice(0, maxLength);
}

export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^0-9+\-\s()]/g, '').trim().slice(0, 20);
}

export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^a-zA-Z0-9@._+\-]/g, '').trim().slice(0, 254);
}

export function sanitizeItemName(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>&"'`]/g, '').trim().slice(0, 100);
}

export function sanitizeDisplayName(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>&"'`]/g, '').replace(/[0-9]/g, '').trim().slice(0, 100);
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
      default:
        out[key] = sanitizeString(value, 500);
    }
  }
  return out;
}
