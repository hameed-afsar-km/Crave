'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Users, Search, Shield, ShieldCheck, UserCog,
  AlertCircle, CheckCircle, Store
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { auth } from '@/lib/firebase';

interface ManagedUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  assignedOutletId: string | null;
  assignedOutletName: string | null;
  photoURL: string | null;
  updatedAt: number | null;
}

const ROLES = [
  { value: 'customer', label: 'Customer', icon: Users, color: 'zinc' },
  { value: 'outlet_staff', label: 'Outlet Staff', icon: UserCog, color: 'blue' },
  { value: 'outlet_manager', label: 'Outlet Manager', icon: ShieldCheck, color: 'amber' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'red' },
] as const;

const roleColor: Record<string, string> = {
  customer: 'bg-zinc-800/50 text-zinc-400 border-zinc-700',
  outlet_staff: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  outlet_manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  admin: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function UserManagement() {
  const { isMasterAdmin, user: currentUser } = useAuth();
  const { outlets } = useAdminOutlet();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const idToken = await auth?.currentUser?.getIdToken();
        if (!idToken) return;
        const res = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const updateUser = async (uid: string, role: string, outletId: string, outletName: string) => {
    setSaving(true);
    setMessage('');
    try {
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error('Not authenticated');
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid, role, assignedOutletId: outletId, assignedOutletName: outletName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }
      setUsers(prev =>
        prev.map(u =>
          u.uid === uid
            ? { ...u, role, assignedOutletId: outletId || null, assignedOutletName: outletName || null }
            : u
        )
      );
      setEditingUser(null);
      setMessage('User updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setMessage(message);
    }
    setSaving(false);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'outlet_manager').length,
    staff: users.filter(u => u.role === 'outlet_staff').length,
    customers: users.filter(u => u.role === 'customer').length,
  };

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="bg-[#0D0D14] border-b border-zinc-800/60">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-zinc-400" />
                  <h1 className="text-xl font-bold text-white">User Management</h1>
                </div>
                <p className="text-zinc-500 text-sm">Assign roles and outlet access</p>
              </div>
            </div>
          </div>
          {message && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              message.startsWith('Failed') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {message.startsWith('Failed') ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />} {message}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'zinc' },
            { label: 'Admins', value: stats.admins, color: 'red' },
            { label: 'Managers', value: stats.managers, color: 'amber' },
            { label: 'Staff', value: stats.staff, color: 'blue' },
            { label: 'Customers', value: stats.customers, color: 'zinc' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#12121A] border border-zinc-800/60 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[11px] text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input type="text" placeholder="Search users by name, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500 font-medium text-sm">No users yet</p>
            <p className="text-zinc-600 text-xs mt-1">Users will appear here after they sign up</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filtered.map((u, i) => (
              <motion.div key={u.uid} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="bg-[#12121A] border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700/60 transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                        {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.name || 'Unnamed'}</p>
                        <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.assignedOutletName && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        <Store className="w-2.5 h-2.5" /> {u.assignedOutletName}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${roleColor[u.role] || roleColor.customer}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                    {u.uid !== currentUser?.uid && (
                      <button onClick={() => setEditingUser(u)}
                        className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all text-xs"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            outlets={outlets}
            saving={saving}
            onSave={(role, outletId, outletName) => updateUser(editingUser.uid, role, outletId, outletName)}
            onClose={() => setEditingUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditUserModal({
  user,
  outlets,
  saving,
  onSave,
  onClose,
}: {
  user: ManagedUser;
  outlets: { id: string; name: string }[];
  saving: boolean;
  onSave: (role: string, outletId: string, outletName: string) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [outletId, setOutletId] = useState(user.assignedOutletId || '');
  const [outletName, setOutletName] = useState(user.assignedOutletName || '');

  const needsOutlet = role === 'outlet_manager' || role === 'outlet_staff';

  const handleSave = () => {
    if (needsOutlet && !outletId) return;
    onSave(role, needsOutlet ? outletId : '', needsOutlet ? outletName : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-md shadow-xl z-10"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Edit User</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button key={r.value} onClick={() => setRole(r.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    role === r.value
                      ? `${roleColor[r.value]} border-current`
                      : 'bg-zinc-800/30 border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <r.icon className="w-3.5 h-3.5" />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {needsOutlet && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Assigned Outlet *</label>
              <select
                value={outletId}
                onChange={(e) => {
                  const opt = outlets.find(o => o.id === e.target.value);
                  setOutletId(e.target.value);
                  setOutletName(opt?.name || '');
                }}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500"
              >
                <option value="">Select an outlet...</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || (needsOutlet && !outletId)}
            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
