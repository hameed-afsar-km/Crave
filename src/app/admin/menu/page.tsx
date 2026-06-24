'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { menuItems as initialItems } from '@/lib/data';
import { getStoredMenuItems } from '@/lib/seed-data';
import { MenuItem } from '@/types';

export default function AdminMenu() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<MenuItem[]>(() => getStoredMenuItems() ?? initialItems);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Burgers', image: '' });

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAvailability = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, image: item.image });
    setShowForm(true);
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm({ name: '', description: '', price: '', category: 'Burgers', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' });
    setShowForm(true);
  };

  const saveItem = () => {
    if (!form.name || !form.price) return;
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? {
        ...i, name: form.name, description: form.description, price: Number(form.price), category: form.category, image: form.image,
      } : i));
    } else {
      const newItem: MenuItem = {
        id: String(Date.now()),
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        image: form.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        rating: 0,
        available: true,
      };
      setItems(prev => [newItem, ...prev]);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <p className="text-zinc-500 font-black">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06060A] pt-16 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="p-2 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 hover:border-gold/22 text-zinc-400 hover:text-gold transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Menu Management</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Add, edit, or remove catalog items</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAdd}
              className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-full shadow-lg shadow-gold/10 hover:shadow-gold/20 hover:brightness-110 transition-all duration-300"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Item</span>
            </motion.button>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 input-dark rounded-xl text-sm font-medium"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 relative z-10">
        <div className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05] bg-black/30">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Item</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Category</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Price</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Rating</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/[0.04] hover:bg-gold/[0.015] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Image src={item.image} alt={item.name} width={48} height={48} className="rounded-xl object-cover border border-white/5 shadow-inner" />
                        <div>
                          <p className="font-bold text-sm text-white group-hover:text-gold transition-colors">{item.name}</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[220px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">{item.category}</td>
                    <td className="px-6 py-4 font-black text-sm text-zinc-200">₹{item.price}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gold">
                      {item.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gold glow-text-sm">★</span>
                          <span>{item.rating}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        item.available ? 'bg-emerald-500/8 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/8 text-rose-400 border border-rose-500/15'
                      }`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => toggleAvailability(item.id)}
                          className="p-2 text-zinc-400 border border-white/8 hover:border-white/18 bg-white/4 hover:bg-white/8 rounded-xl transition-all"
                          title={item.available ? 'Disable' : 'Enable'}>
                          {item.available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => openEdit(item)}
                          className="p-2 text-gold border border-gold/12 hover:border-gold/30 bg-gold/5 hover:bg-gold/12 rounded-xl transition-all" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)}
                          className="p-2 text-rose-400 border border-rose-500/12 hover:border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/12 rounded-xl transition-all" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-zinc-600 font-black text-sm uppercase tracking-wider">
              No items found
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[rgba(15,14,24,0.9)] backdrop-blur-2xl border border-white/[0.08] rounded-[28px] p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10"
          >
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Item Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                    className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium appearance-none bg-[image:var(--select-arrow)]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 16px center',
                      backgroundSize: '16px',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <option className="bg-zinc-950 text-white">Burgers</option>
                    <option className="bg-zinc-950 text-white">Shawarma</option>
                    <option className="bg-zinc-950 text-white">Fries</option>
                    <option className="bg-zinc-950 text-white">Drinks</option>
                    <option className="bg-zinc-950 text-white">Combos</option>
                    <option className="bg-zinc-950 text-white">Desserts</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Image URL</label>
                <input type="text" value={form.image} onChange={(e) => setForm({...form, image: e.target.value})}
                  className="w-full px-4 py-3 input-dark rounded-xl text-sm font-medium" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3.5 border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/6 text-zinc-300 font-bold uppercase tracking-widest text-[10px] rounded-full transition-all duration-300">
                Cancel
              </button>
              <button onClick={saveItem}
                className="flex-1 py-3.5 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-full shadow-lg shadow-gold/10 hover:shadow-gold/25 hover:brightness-110 transition-all duration-300">
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
