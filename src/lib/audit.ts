import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export type AuditAction =
  | 'order.created'
  | 'order.status_changed'
  | 'order.cancelled'
  | 'menu.created'
  | 'menu.updated'
  | 'menu.deleted'
  | 'outlet.created'
  | 'outlet.updated'
  | 'outlet.deleted'
  | 'settings.updated'
  | 'settings.reset'
  | 'data.cleared'
  | 'data.seeded';

export interface AuditUser {
  email: string;
  role: string;
  name: string;
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) return email;
  return email[0] + '***' + email.slice(at - 1);
}

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

function maskPII(obj: Record<string, any>): Record<string, any> {
  const masked: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (/email/i.test(key)) {
        masked[key] = maskEmail(value);
      } else if (/phone/i.test(key) || /contact/i.test(key)) {
        masked[key] = maskPhone(value);
      } else {
        masked[key] = value;
      }
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export async function logAction(
  action: AuditAction,
  targetType: string,
  targetId: string,
  details: Record<string, any>,
  user?: AuditUser,
  outletId?: string,
  outletName?: string
): Promise<void> {
  if (!db) return;
  try {
    const now = new Date();
    const expireAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await addDoc(collection(db, 'auditLogs'), {
      action,
      targetType,
      targetId,
      details: maskPII(details),
      userEmail: user?.email ? maskEmail(user.email) : 'unknown',
      userRole: user?.role || 'unknown',
      userName: user?.name || 'unknown',
      outletId: outletId || '',
      outletName: outletName || '',
      createdAt: serverTimestamp(),
      expireAt: Timestamp.fromDate(expireAt),
    });
  } catch {
    // Silently fail — logging should never block the main operation
  }
}
