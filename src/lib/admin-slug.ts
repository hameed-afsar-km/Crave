export const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'admin';

export function adminPath(sub?: string): string {
  return sub ? `/${ADMIN_SLUG}/${sub}` : `/${ADMIN_SLUG}`;
}
