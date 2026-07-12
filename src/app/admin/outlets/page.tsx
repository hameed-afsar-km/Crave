'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Store, MapPin, Clock, Plus, Edit2, Trash2,
  X, Users, Phone, Mail, CookingPot, AlertTriangle,
  Search, CheckCircle, XCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { Outlet } from '@/types';
import { saveOutletToFirestore, deleteOutletFromFirestore } from '@/lib/firestore-service';
import { logAction } from '@/lib/audit';
import { adminPath } from '@/lib/admin-slug';


export default function OutletManagement() {
  const { isMasterAdmin, user } = useAuth();
  const { outlets } = useAdminOutlet();
  const [showForm, setShowForm] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '',
    openingHours: '08:00', closingHours: '23:00',
    maxOrdersPerSlot: 10, preparationTime: 18,
    isOpen: true,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const openAdd = () => {
    setEditingOutlet(null);
    setForm({
      name: '', address: '', phone: '', email: '',
      openingHours: '08:00', closingHours: '23:00',
      maxOrdersPerSlot: 10, preparationTime: 18, isOpen: true,
    });
    setShowForm(true);
  };

  const openEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setForm({
      name: outlet.name,
      address: outlet.address || '',
      phone: outlet.phone || '',
      email: outlet.email || '',
      openingHours: outlet.openingHours || '08:00',
      closingHours: outlet.closingHours || '23:00',
      maxOrdersPerSlot: outlet.maxOrdersPerSlot || 10,
      preparationTime: outlet.preparationTime || 18,
      isOpen: outlet.isOpen !== false,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    setMessage('');
    try {
      const id = editingOutlet?.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
      const outletData: Outlet = {
        id,
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        openingHours: form.openingHours,
        closingHours: form.closingHours,
        maxOrdersPerSlot: form.maxOrdersPerSlot,
        preparationTime: form.preparationTime,
        pickupWindow: 30,
        isOpen: form.isOpen,
        status: 'active' as const,
      };
      await saveOutletToFirestore(outletData);
      setShowForm(false);
      setEditingOutlet(null);
      setMessage('Outlet saved successfully');
      setTimeout(() => setMessage(''), 3000);
      logAction(editingOutlet ? 'outlet.updated' : 'outlet.created', 'outlet', id, { name: form.name }, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
    } catch {
      setMessage('Failed to save outlet');
    }
    setSaving(false);
  };

  const deleteOutlet = async (id: string) => {
    try {
      await deleteOutletFromFirestore(id);
      setDeleteConfirm(null);
      setMessage('Outlet deleted');
      setTimeout(() => setMessage(''), 3000);
      logAction('outlet.deleted', 'outlet', id, {}, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
    } catch {
      setMessage('Failed to delete outlet');
    }
  };

  const toggleOpen = async (outlet: Outlet) => {
    const nextOpen = outlet.isOpen !== false ? false : true;
    await saveOutletToFirestore({ ...outlet, isOpen: nextOpen });
    logAction('outlet.updated', 'outlet', outlet.id, { name: outlet.name, isOpen: nextOpen }, { email: user?.email || '', role: user?.role || '', name: user?.name || '' });
  };

  const openCount = outlets.filter(o => o.isOpen !== false).length;
  const closedCount = outlets.filter(o => o.isOpen === false).length;

  const filtered = outlets.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.address?.toLowerCase().includes(search.toLowerCase())
  );

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
              <Link href={adminPath('settings')} className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-zinc-400" />
                  <h1 className="text-xl font-bold text-white">Outlet Management</h1>
                </div>
                <p className="text-zinc-500 text-sm">Manage restaurant locations</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Outlet
            </motion.button>
          </div>
          {message && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              message.startsWith('Failed') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" /> {message}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Outlets', value: outlets.length, icon: Store, color: 'zinc' },
            { label: 'Open', value: openCount, icon: CheckCircle, color: 'emerald' },
            { label: 'Closed', value: closedCount, icon: XCircle, color: 'red' },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#12121A] border border-zinc-800/60 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'emerald' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                stat.color === 'red' ? 'bg-red-500/10 border border-red-500/20' :
                'bg-zinc-800/50 border border-zinc-700/50'
              }`}>
                <stat.icon className={`w-4 h-4 ${
                  stat.color === 'emerald' ? 'text-emerald-400' :
                  stat.color === 'red' ? 'text-red-400' :
                  'text-zinc-400'
                }`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input type="text" placeholder="Search outlets..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
          </div>
        </div>

        {/* Outlet List */}
        {outlets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500 font-medium text-sm">No outlets configured</p>
            <p className="text-zinc-600 text-xs mt-1">Create your first outlet to get started</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500 font-medium text-sm">No outlets match your search</p>
            <p className="text-zinc-600 text-xs mt-1">Try a different name or address</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((outlet, i) => {
              const isOpen = outlet.isOpen !== false;
              return (
                <motion.div key={outlet.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`relative bg-[#12121A] border rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-700/60 ${
                    isOpen ? 'border-zinc-800/60' : 'border-zinc-800/40'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isOpen ? 'bg-emerald-500' : 'bg-red-500/60'}`} />
                  <div className="p-5 pl-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isOpen ? 'bg-emerald-500/10' : 'bg-zinc-800/50'
                          }`}>
                            <Store className={`w-4 h-4 ${isOpen ? 'text-emerald-400' : 'text-zinc-500'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-white">{outlet.name}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                                isOpen
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {isOpen ? 'Open' : 'Closed'}
                              </span>
                            </div>
                            {outlet.address && (
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" /> {outlet.address}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-xs text-zinc-500">
                          {outlet.phone && (
                            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-600" /> {outlet.phone}</span>
                          )}
                          {outlet.email && (
                            <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-600" /> {outlet.email}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 pt-2.5 border-t border-zinc-800/60 text-xs text-zinc-500">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-zinc-600" /> {outlet.openingHours || '08:00'} - {outlet.closingHours || '23:00'}</span>
                          <span className="flex items-center gap-1.5"><CookingPot className="w-3 h-3 text-zinc-600" /> Prep: {outlet.preparationTime || 18}min</span>
                          <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-zinc-600" /> Max: {outlet.maxOrdersPerSlot || 10}/slot</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => toggleOpen(outlet)} className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          isOpen
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                        }`} title={isOpen ? 'Close' : 'Open'}>
                          {isOpen ? 'Open' : 'Closed'}
                        </button>
                        <button onClick={() => openEdit(outlet)} className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(outlet.id)} className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-lg shadow-xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                    <Store className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h2 className="text-base font-bold text-white">
                    {editingOutlet ? 'Edit Outlet' : 'Add New Outlet'}
                  </h2>
                </div>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Outlet Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Address</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Phone</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Opening Time</label>
                    <input type="time" value={form.openingHours} onChange={(e) => setForm({...form, openingHours: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Closing Time</label>
                    <input type="time" value={form.closingHours} onChange={(e) => setForm({...form, closingHours: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Prep Time (min)</label>
                    <input type="number" value={form.preparationTime} onChange={(e) => setForm({...form, preparationTime: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Max Orders / Slot</label>
                    <input type="number" value={form.maxOrdersPerSlot} onChange={(e) => setForm({...form, maxOrdersPerSlot: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div onClick={() => setForm({...form, isOpen: !form.isOpen})}
                      className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                        form.isOpen ? 'bg-emerald-500/30' : 'bg-zinc-700'
                      }`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all ${
                        form.isOpen ? 'left-5.5 bg-emerald-400' : 'left-0.5 bg-zinc-400'
                      }`} />
                    </div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-200 transition-colors">Outlet is open</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">
                  Cancel
                </button>
                <button onClick={save} disabled={!form.name || saving}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {saving ? 'Saving...' : editingOutlet ? 'Save Changes' : 'Add Outlet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-sm shadow-xl z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Delete Outlet</h2>
              <p className="text-sm text-zinc-400 mb-6">Are you sure? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">
                  Keep
                </button>
                <button onClick={() => deleteOutlet(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-500 transition-all">
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
