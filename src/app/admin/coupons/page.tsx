'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Tag, X, Percent, IndianRupee, Calendar, Users, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { Coupon } from '@/types';
import { subscribeCoupons, addCoupon, updateCoupon, deleteCoupon } from '@/lib/firestore-service';
import { logAction } from '@/lib/audit';
import { adminPath } from '@/lib/admin-slug';
import { formatPrice } from '@/lib/utils';

export default function AdminCoupons() {
  const { canManageCoupons, isMasterAdmin, user } = useAuth();
  const { selectedOutletId, outlets, setSelectedOutletId, isAllOutlets } = useAdminOutlet();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableOutlets: [] as string[],
  });

  useEffect(() => {
    if (!canManageCoupons) return;
    const unsub = subscribeCoupons((firestoreCoupons) => {
      setCoupons(firestoreCoupons);
    });
    return unsub;
  }, [canManageCoupons]);

  const outletFiltered = useMemo(() => {
    if (isMasterAdmin && isAllOutlets) return coupons;
    if (isMasterAdmin) return coupons.filter(c =>
      !c.applicableOutlets || c.applicableOutlets.length === 0 || c.applicableOutlets.includes(selectedOutletId)
    );
    return coupons.filter(c =>
      !c.applicableOutlets || c.applicableOutlets.length === 0 || c.applicableOutlets.includes(selectedOutletId)
    );
  }, [coupons, selectedOutletId, isAllOutlets, isMasterAdmin]);

  const filtered = outletFiltered.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return 'disabled';
    if (new Date(coupon.validUntil) < new Date()) return 'expired';
    if (new Date(coupon.validFrom) > new Date()) return 'upcoming';
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'limit_reached';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'expired': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'disabled': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'upcoming': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'limit_reached': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expired': return 'Expired';
      case 'disabled': return 'Disabled';
      case 'upcoming': return 'Upcoming';
      case 'limit_reached': return 'Limit Reached';
      default: return status;
    }
  };

  const openAdd = () => {
    setEditingCoupon(null);
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setForm({
      code: '', description: '', discountType: 'percentage', discountValue: '',
      minOrderAmount: '', maxDiscountAmount: '', usageLimit: '',
      validFrom: today, validUntil: nextMonth, isActive: true, applicableOutlets: [],
    });
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code, description: coupon.description, discountType: coupon.discountType,
      discountValue: String(coupon.discountValue), minOrderAmount: String(coupon.minOrderAmount || ''),
      maxDiscountAmount: String(coupon.maxDiscountAmount || ''), usageLimit: String(coupon.usageLimit || ''),
      validFrom: coupon.validFrom.slice(0, 10), validUntil: coupon.validUntil.slice(0, 10),
      isActive: coupon.isActive, applicableOutlets: coupon.applicableOutlets || [],
    });
    setShowForm(true);
  };

  const saveCoupon = async () => {
    if (!form.code || !form.discountValue || !form.validFrom || !form.validUntil) return;
    const auditUser = { email: user?.email || '', role: user?.role || '', name: user?.name || '' };
    const couponData = {
      code: form.code.toUpperCase().trim(), description: form.description,
      discountType: form.discountType, discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: new Date(form.validUntil + 'T23:59:59').toISOString(),
      isActive: form.isActive,
      applicableOutlets: isMasterAdmin ? form.applicableOutlets : [selectedOutletId],
    };
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, couponData);
        logAction('coupon.updated', 'coupon', editingCoupon.id, { code: couponData.code }, auditUser);
      } else {
        const newId = await addCoupon(couponData as any);
        logAction('coupon.created', 'coupon', newId || 'unknown', { code: couponData.code }, auditUser);
      }
      setShowForm(false);
      setEditingCoupon(null);
    } catch (error) {
      alert('Failed to save coupon. Please try again.');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    const auditUser = { email: user?.email || '', role: user?.role || '', name: user?.name || '' };
    try {
      await deleteCoupon(coupon.id);
      logAction('coupon.deleted', 'coupon', coupon.id, { code: coupon.code }, auditUser);
      setDeleteConfirm(null);
    } catch { alert('Failed to delete coupon.'); }
  };

  const toggleActive = async (coupon: Coupon) => {
    const auditUser = { email: user?.email || '', role: user?.role || '', name: user?.name || '' };
    await updateCoupon(coupon.id, { isActive: !coupon.isActive });
    logAction('coupon.updated', 'coupon', coupon.id, { code: coupon.code, field: 'isActive' }, auditUser);
  };

  if (!canManageCoupons) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500 font-medium">Access Denied</p></div>;
  }

  const inputClass = "w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500";

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="bg-[#0D0D14] border-b border-zinc-800/60">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link href={adminPath('dashboard')} className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Coupon Management</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Create and manage discount coupons</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Coupon
            </motion.button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input type="text" placeholder="Search coupons..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
            </div>
          </div>
          {isMasterAdmin && outlets.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
              <button onClick={() => setSelectedOutletId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${isAllOutlets ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'}`}>
                <Store className="w-3 h-3" /> All Outlets
              </button>
              {outlets.map((outlet) => (
                <button key={outlet.id} onClick={() => setSelectedOutletId(outlet.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${selectedOutletId === outlet.id ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'}`}>
                  <Store className="w-3 h-3" /> {outlet.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto">
        <div className="bg-[#12121A] border border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-800/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Discount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Min Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Usage</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valid Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((coupon, i) => {
                  const status = getStatus(coupon);
                  return (
                    <motion.tr key={coupon.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/18 flex items-center justify-center">
                            <Tag className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white tracking-wider">{coupon.code}</p>
                            <p className="text-xs text-zinc-400 truncate max-w-[200px]">{coupon.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {coupon.discountType === 'percentage' ? (
                            <><Percent className="w-3.5 h-3.5 text-gold" /><span className="font-medium text-sm text-white">{coupon.discountValue}%</span></>
                          ) : (
                            <><IndianRupee className="w-3.5 h-3.5 text-gold" /><span className="font-medium text-sm text-white">{coupon.discountValue}</span></>
                          )}
                        </div>
                        {coupon.maxDiscountAmount && coupon.discountType === 'percentage' && (
                          <p className="text-[10px] text-zinc-500">Max: {formatPrice(coupon.maxDiscountAmount)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-zinc-300">
                        {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : '-'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{coupon.usageCount}</span>
                          {coupon.usageLimit && <span className="text-xs text-zinc-500">/ {coupon.usageLimit}</span>}
                        </div>
                        {coupon.usageLimit && (
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                            <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100)}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(coupon.validFrom).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">to {new Date(coupon.validUntil).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => toggleActive(coupon)} className="p-1.5 text-zinc-500 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 rounded-lg transition-all" title={coupon.isActive ? 'Disable' : 'Enable'}>
                            {coupon.isActive ? <X className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => openEdit(coupon)} className="p-1.5 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 rounded-lg transition-all" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(coupon)} className="p-1.5 text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500 font-medium text-sm">No coupons found</div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowForm(false); setEditingCoupon(null); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-lg shadow-xl z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-white mb-5">{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Coupon Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
                  placeholder="e.g. SUMMER20" className={inputClass + ' uppercase tracking-wider font-bold'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="e.g. Summer sale discount" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Discount Type *</label>
                  <select value={form.discountType} onChange={(e) => setForm({...form, discountType: e.target.value as 'percentage' | 'fixed'})}
                    className={inputClass}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (INR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Discount Value *</label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm({...form, discountValue: e.target.value})}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 100'} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Min Order Amount</label>
                  <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({...form, minOrderAmount: e.target.value})}
                    placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Max Discount (for %)</label>
                  <input type="number" value={form.maxDiscountAmount} onChange={(e) => setForm({...form, maxDiscountAmount: e.target.value})}
                    placeholder="No limit" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={(e) => setForm({...form, usageLimit: e.target.value})}
                  placeholder="No limit" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Valid From *</label>
                  <input type="date" value={form.validFrom} onChange={(e) => setForm({...form, validFrom: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Valid Until *</label>
                  <input type="date" value={form.validUntil} onChange={(e) => setForm({...form, validUntil: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({...form, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-gold focus:ring-zinc-500" />
                <label className="text-xs font-medium text-zinc-400">Active</label>
              </div>
              {isMasterAdmin && outlets.length > 0 && (
                <div className="border-t border-zinc-800/60 pt-4">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Applicable Outlets</label>
                  <p className="text-[10px] text-zinc-500 mb-2">Leave empty to apply to all outlets</p>
                  {outlets.map(outlet => (
                    <label key={outlet.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input type="checkbox" checked={form.applicableOutlets.includes(outlet.id)}
                        onChange={(e) => setForm({
                          ...form,
                          applicableOutlets: e.target.checked
                            ? [...form.applicableOutlets, outlet.id]
                            : form.applicableOutlets.filter(id => id !== outlet.id)
                        })}
                        className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-white focus:ring-zinc-500" />
                      <span className="text-xs text-zinc-300">{outlet.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditingCoupon(null); }}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">
                Cancel
              </button>
              <button onClick={saveCoupon}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all">
                {editingCoupon ? 'Save Changes' : 'Add Coupon'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-sm shadow-xl z-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">Delete Coupon</h2>
            <p className="text-zinc-400 text-sm mb-5">
              Are you sure you want to delete coupon <span className="font-bold text-white">{deleteConfirm.code}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-all border border-red-500/30">
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
