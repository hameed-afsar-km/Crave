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
