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
  | 'data.seeded'
  | 'admin.login'
  | 'admin.login.failed'
  | 'admin.logout'
  | 'admin.unauthorized_access'
  | 'admin.token_expired'
  | 'admin.role_mismatch'
  | 'auth.suspicious';

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

export interface AdminAuditInfo {
  ip?: string;
  userAgent?: string;
  route?: string;
  uid?: string;
}

export async function logAction(
  action: AuditAction,
  targetType: string,
  targetId: string,
  details: Record<string, any>,
  user?: AuditUser,
  outletId?: string,
  outletName?: string,
  adminInfo?: AdminAuditInfo
): Promise<void> {
  if (!db) return;
  try {
    const now = new Date();
    const expireAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const logEntry: Record<string, any> = {
      action,
      targetType,
      targetId,
      details: maskPII(details),
      userEmail: user?.email ? maskEmail(user.email) : 'unknown',
      userRole: user?.role || 'unknown',
      userName: user?.name || (user?.email ? user.email.split('@')[0] : 'unknown'),
      outletId: outletId || '',
      outletName: outletName || '',
      createdAt: serverTimestamp(),
      expireAt: Timestamp.fromDate(expireAt),
    };
    if (adminInfo?.ip) logEntry.ip = adminInfo.ip;
    if (adminInfo?.userAgent) logEntry.userAgent = adminInfo.userAgent;
    if (adminInfo?.route) logEntry.route = adminInfo.route;
    if (adminInfo?.uid) logEntry.uid = adminInfo.uid;
    await addDoc(collection(db, 'auditLogs'), logEntry);
  } catch {
    // Silently fail — logging should never block the main operation
  }
}
