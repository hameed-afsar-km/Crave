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
      details,
      userEmail: user?.email || 'unknown',
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
