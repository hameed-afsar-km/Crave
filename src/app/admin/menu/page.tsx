'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { menuItems as initialItems } from '@/lib/data';
import { MenuItem } from '@/types';

export default function AdminMenu() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<MenuItem[]>(initialItems);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="bg-gray-950 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Menu Management</h1>
                <p className="text-gray-400 mt-1">Add, edit, or remove menu items</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold to-amber-600 text-white font-medium rounded-full text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </motion.button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-black">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Item</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Price</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Rating</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-800 hover:bg-gold/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <p className="font-semibold text-sm text-white">{item.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{item.category}</td>
                    <td className="px-6 py-4 font-semibold text-sm">₹{item.price}</td>
                    <td className="px-6 py-4 text-sm">{item.rating > 0 ? `★ ${item.rating}` : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        item.available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => toggleAvailability(item.id)}
                          className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
                          title={item.available ? 'Disable' : 'Enable'}>
                          {item.available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(item)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteItem(item.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">No items found</div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-gray-950 border border-gray-800 rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-6">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gold">
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
                <label className="block text-sm font-medium text-gray-400 mb-1">Image URL</label>
                <input type="text" value={form.image} onChange={(e) => setForm({...form, image: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 border border-gray-700 rounded-full text-gray-300 font-medium hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={saveItem}
                className="flex-1 py-3 bg-gradient-to-r from-gold to-amber-600 text-white rounded-full font-medium hover:shadow-lg transition-all">
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
