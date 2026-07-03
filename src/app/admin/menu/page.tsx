'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Eye, EyeOff, TrendingUp, TrendingDown, Store, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { MenuItem } from '@/types';
import { subscribeMenuItems, subscribeOrders, addMenuItem as addFirestoreItem, updateMenuItem, deleteMenuItem as deleteFirestoreItem } from '@/lib/firestore-service';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logAction } from '@/lib/audit';
import { validateImageMagicBytes } from '@/lib/validate-image';

export default function AdminMenu() {
  const { isAdmin, isMasterAdmin, isOutletStaff, user } = useAuth();
  const { selectedOutletId, outlets, setSelectedOutletId, isAllOutlets } = useAdminOutlet();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: 'Burgers', image: '',
    availableOutlets: [] as string[],
    pricing: {} as Record<string, number>,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsub = subscribeMenuItems((firestoreItems) => {
      setItems(firestoreItems);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const url = previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [previewUrl]);

  const [itemOrderCounts, setItemOrderCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = subscribeOrders((firestoreOrders) => {
      const counts: Record<string, number> = {};
      firestoreOrders.forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          const name = item.name || '';
          counts[name] = (counts[name] || 0) + (item.qty || 1);
        });
      });
      setItemOrderCounts(counts);
    });
    return unsub;
  }, []);

  const sortedByOrders = useMemo(() => {
    return [...items].sort((a, b) => (itemOrderCounts[b.name] || 0) - (itemOrderCounts[a.name] || 0));
  }, [items, itemOrderCounts]);

  const maxOrders = Math.max(...Object.values(itemOrderCounts), 1);

  const outletFiltered = useMemo(() => {
    if (isMasterAdmin && isAllOutlets) return items;
    if (isMasterAdmin) return items.filter(i =>
      i.availableOutlets ? i.availableOutlets.includes(selectedOutletId) : true
    );
    return items;
  }, [items, selectedOutletId, isAllOutlets, isMasterAdmin]);

  const filtered = outletFiltered.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const getItemPrice = (item: MenuItem): number => {
    if (isMasterAdmin && !isAllOutlets && item.pricing?.[selectedOutletId] != null) {
      return item.pricing[selectedOutletId];
    }
    if (!isMasterAdmin && item.pricing?.[selectedOutletId] != null) {
      return item.pricing[selectedOutletId];
    }
    return item.price;
  };

  const isItemAvailableAtOutlet = (item: MenuItem, outletId: string): boolean => {
    if (item.availableOutlets && !item.availableOutlets.includes(outletId)) return false;
    return item.available !== false;
  };

  const toggleAvailability = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const auditUser = { email: user?.email || '', role: user?.role || '', name: user?.name || '' };
    if (isMasterAdmin && !isAllOutlets) {
      const current = item.availableOutlets || [];
      const updated = current.includes(selectedOutletId)
        ? current.filter(oid => oid !== selectedOutletId)
        : [...current, selectedOutletId];
      updateMenuItem(id, { availableOutlets: updated });
    } else {
      updateMenuItem(id, { available: !item.available });
    }
    logAction('menu.updated', 'menu', id, { name: item.name, field: 'availability', toggled: true }, auditUser);
  };

  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    deleteFirestoreItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    const auditUser = { email: user?.email || '', role: user?.role || '', name: user?.name || '' };
    logAction('menu.deleted', 'menu', id, { name: item?.name || '' }, auditUser);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImageFile(null);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      image: item.image,
      availableOutlets: item.availableOutlets || [],
      pricing: item.pricing || {},
    });
    setShowForm(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setImageFile(null);
    setForm({
      name: '', description: '', price: '', category: 'Burgers',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
      availableOutlets: [],
      pricing: {},
    });
    setShowForm(true);
  };

  const saveItem = async () => {
    if (!form.name || !form.price) return;
    setUploading(true);
    try {
      let imageUrl = form.image;
      if (imageFile && storage) {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const id = crypto.randomUUID();
        const path = `menu-items/${id}.${ext}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      const auditUser = { email: user?.email || '', role: user?.role || '', name: user?.name || '' };
      if (editingItem) {
        await updateMenuItem(editingItem.id, {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          image: imageUrl,
          availableOutlets: form.availableOutlets,
          pricing: form.pricing,
        });
        logAction('menu.updated', 'menu', editingItem.id, { name: form.name, category: form.category, price: form.price }, auditUser);
      } else {
        const newId = await addFirestoreItem({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          image: imageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
          rating: 0,
          available: true,
          availableOutlets: form.availableOutlets,
          pricing: form.pricing,
        });
        logAction('menu.created', 'menu', newId || 'unknown', { name: form.name, category: form.category, price: form.price }, auditUser);
      }
      setShowForm(false);
      setEditingItem(null);
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  if (!isAdmin && !isOutletStaff) {
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
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Menu Management</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Add, edit, or remove catalog items</p>
              </div>
            </div>
            {!isOutletStaff && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </motion.button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input type="text" placeholder="Search menu items..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
            </div>
          </div>

          {isMasterAdmin && outlets.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
              <button onClick={() => setSelectedOutletId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isAllOutlets ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                }`}
              >
                <MapPin className="w-3 h-3" /> All Outlets
              </button>
              {outlets.map((outlet) => (
                <button key={outlet.id} onClick={() => setSelectedOutletId(outlet.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedOutletId === outlet.id ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  <MapPin className="w-3 h-3" /> {outlet.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedOutletId === outlet.id ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'}`}>
                    {items.filter((i: MenuItem) => i.availableOutlets ? i.availableOutlets.includes(outlet.id) : true).length}
                  </span>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Outlet</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-lg object-cover border border-zinc-700" />
                        <div>
                          <p className="font-medium text-sm text-white">{item.name}</p>
                          <p className="text-xs text-zinc-400 truncate max-w-[220px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-zinc-300">{item.category}</td>
                    <td className="px-5 py-3 font-medium text-sm text-white">₹{getItemPrice(item)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">{itemOrderCounts[item.name] || 0}</span>
                            <span className="text-xs text-zinc-500">orders</span>
                          </div>
                          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                            <div className="h-full rounded-full bg-zinc-500" style={{ width: `${Math.min(100, ((itemOrderCounts[item.name] || 0) / maxOrders) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {isMasterAdmin && !isAllOutlets ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                          isItemAvailableAtOutlet(item, selectedOutletId) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          <Store className="w-2.5 h-2.5" />
                          {isItemAvailableAtOutlet(item, selectedOutletId) ? 'Available' : 'Hidden'}
                        </span>
                      ) : isMasterAdmin ? (
                        <div className="flex gap-1 flex-wrap">
                          {outlets.map(o => (
                            <span key={o.id} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                              isItemAvailableAtOutlet(item, o.id) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {o.name.split(' ').pop()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                          isItemAvailableAtOutlet(item, selectedOutletId) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {isItemAvailableAtOutlet(item, selectedOutletId) ? 'Available' : 'Hidden'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                        item.available !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {item.available !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        {!isOutletStaff && (
                          <>
                            <button onClick={() => toggleAvailability(item.id)} className="p-1.5 text-zinc-500 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300 rounded-lg transition-all" title={isItemAvailableAtOutlet(item, selectedOutletId) ? 'Disable' : 'Enable'}>
                              {isItemAvailableAtOutlet(item, selectedOutletId) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => openEdit(item)} className="p-1.5 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 rounded-lg transition-all" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500 font-medium text-sm">No items found</div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowForm(false); setImageFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-2xl shadow-xl z-10 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-base font-bold text-white mb-5">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Item Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Base Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500">
                    <option>Burgers</option>
                    <option>Shawarma</option>
                    <option>Fries</option>
                    <option>Drinks</option>
                    <option>Combos</option>
                    <option>Desserts</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Image</label>
                <div className="flex items-center gap-3">
                  {(previewUrl || form.image) && (
                    <Image src={previewUrl || form.image} alt="Preview" width={64} height={64} className="rounded-lg object-cover border border-zinc-700 shrink-0" />
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
                      if (!allowedTypes.includes(file.type)) {
                        alert('Only JPEG, PNG, WebP, and AVIF images are allowed');
                        e.target.value = '';
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Image must be under 5MB');
                        e.target.value = '';
                        return;
                      }
                      const magicResult = await validateImageMagicBytes(file);
                      if (!magicResult.valid) {
                        alert(magicResult.error);
                        e.target.value = '';
                        return;
                      }
                    }
                    setImageFile(file);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(file ? URL.createObjectURL(file) : null);
                  }}
                    className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 file:cursor-pointer cursor-pointer" />
                </div>
              </div>

              {isMasterAdmin && outlets.length > 0 && (
                <div className="border-t border-zinc-800/60 pt-4">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Outlet Overrides</label>
                  {outlets.map(outlet => (
                    <div key={outlet.id} className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/60">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-300">{outlet.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={form.availableOutlets.includes(outlet.id)}
                              onChange={(e) => setForm({
                                ...form,
                                availableOutlets: e.target.checked
                                  ? [...form.availableOutlets, outlet.id]
                                  : form.availableOutlets.filter(id => id !== outlet.id)
                              })}
                              className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-white focus:ring-zinc-500" />
                            <span className="text-xs text-zinc-500">Available</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-zinc-500">₹</span>
                            <input type="number" placeholder="Override price" value={form.pricing[outlet.id] ?? ''}
                              onChange={(e) => {
                                const updated = { ...form.pricing };
                                if (e.target.value) {
                                  updated[outlet.id] = Number(e.target.value);
                                } else {
                                  delete updated[outlet.id];
                                }
                                setForm({...form, pricing: updated});
                              }}
                              className="w-20 px-2 py-1 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setImageFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} disabled={uploading} className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all disabled:opacity-50">
                Cancel
              </button>
              <button onClick={saveItem} disabled={uploading} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                ) : (
                  editingItem ? 'Save Changes' : 'Add Item'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
