'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Edit2, Trash2, Search, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { menuItems as initialItems } from '@/lib/data';
import { getStoredMenuItems, getStoredOrders, saveMenuItems } from '@/lib/seed-data';
import { MenuItem } from '@/types';

export default function AdminMenu() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<MenuItem[]>(() => getStoredMenuItems() ?? initialItems);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Burgers', image: '' });

  const itemOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const orders = getStoredOrders();
    if (orders) {
      orders.forEach((o: any) => {
        (o.items || []).forEach((item: any) => {
          const name = item.name || '';
          counts[name] = (counts[name] || 0) + (item.qty || 1);
        });
      });
    }
    return counts;
  }, []);

  const sortedByOrders = useMemo(() => {
    return [...items].sort((a, b) => (itemOrderCounts[b.name] || 0) - (itemOrderCounts[a.name] || 0));
  }, [items, itemOrderCounts]);

  const maxOrders = Math.max(...Object.values(itemOrderCounts), 1);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAvailability = (id: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, available: !i.available } : i);
      saveMenuItems(updated);
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      saveMenuItems(updated);
      return updated;
    });
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
    setItems(prev => {
      let updated: MenuItem[];
      if (editingItem) {
        updated = prev.map(i => i.id === editingItem.id ? {
          ...i, name: form.name, description: form.description, price: Number(form.price), category: form.category, image: form.image,
        } : i);
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
        updated = [newItem, ...prev];
      }
      saveMenuItems(updated);
      return updated;
    });
    setShowForm(false);
    setEditingItem(null);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-gray-500 text-sm mt-0.5">Add, edit, or remove catalog items</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </motion.button>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
            />
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-lg object-cover border border-gray-100" />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[220px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-gray-600">{item.category}</td>
                    <td className="px-5 py-3 font-medium text-sm text-gray-900">₹{item.price}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-gray-900">{itemOrderCounts[item.name] || 0}</span>
                            <span className="text-xs text-gray-400">orders</span>
                          </div>
                          <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                            <div className="h-full rounded-full bg-gray-800" style={{ width: `${Math.min(100, ((itemOrderCounts[item.name] || 0) / maxOrders) * 100)}%` }} />
                          </div>
                        </div>
                        {itemOrderCounts[item.name] && itemOrderCounts[item.name] > 0 && (
                          itemOrderCounts[item.name] >= (sortedByOrders.length > 0 ? itemOrderCounts[sortedByOrders[0].name] || 0 : 0) && itemOrderCounts[item.name] > 0
                            ? <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                            : itemOrderCounts[item.name] <= (sortedByOrders.length > 1 ? itemOrderCounts[sortedByOrders[sortedByOrders.length - 1].name] || 0 : 0)
                            ? <TrendingDown className="w-3 h-3 text-red-500 shrink-0" />
                            : null
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-gray-700">
                      {item.rating > 0 ? (
                        <span>{item.rating}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        item.available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleAvailability(item.id)} className="p-1.5 text-gray-400 border border-gray-200 hover:border-gray-300 hover:text-gray-600 rounded-lg transition-all" title={item.available ? 'Disable' : 'Enable'}>
                          {item.available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900 rounded-lg transition-all" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-500 border border-red-200 hover:border-red-300 hover:bg-red-50 rounded-lg transition-all" title="Delete">
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
            <div className="text-center py-12 text-gray-500 font-medium text-sm">No items found</div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowForm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-lg shadow-xl z-10"
          >
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Item Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white">
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                <input type="text" value={form.image} onChange={(e) => setForm({...form, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={saveItem} className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-all">
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
