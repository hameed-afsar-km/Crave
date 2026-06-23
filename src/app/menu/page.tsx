'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { menuItems, categories } from '@/lib/data';
import FoodCard from '@/components/FoodCard';
import { MenuGridSkeleton } from '@/components/LoadingSkeleton';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading] = useState(false);

  const filtered = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  return (
    <div className="min-h-screen bg-[#06060A] pt-28 pb-20 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/8 text-gold text-[10px] font-bold rounded-full border border-gold/18 uppercase tracking-widest mb-4">
            <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
            Taste the Best
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Our <span className="text-gradient-gold">Menu</span>
          </h1>
          <p className="text-zinc-500 mt-2.5 text-sm md:text-base max-w-sm">
            Freshly made with handpicked ingredients, ready when you are.
          </p>
        </motion.div>

        {/* Search + filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-7"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Shawarma, Burger, Fries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 input-dark rounded-2xl text-sm font-medium transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex gap-2 overflow-x-auto pb-3 mb-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.04 }}
              onClick={() => setActiveCategory(cat)}
              className={`px-4.5 py-2 rounded-full text-[11px] font-black whitespace-nowrap uppercase tracking-widest transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-gold to-amber-600 text-white border-transparent shadow-lg shadow-gold/12'
                  : 'bg-white/[0.03] text-zinc-500 border-white/[0.07] hover:text-gold hover:border-gold/20 hover:bg-gold/[0.04]'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>

        {/* Result count */}
        {!loading && searchQuery && (
          <p className="text-xs text-zinc-600 font-semibold mb-6">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
          </p>
        )}

        {/* Product grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <MenuGridSkeleton />
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 rounded-3xl border border-dashed border-white/5 bg-white/[0.01]"
            >
              <Search className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg font-bold">No items found</p>
              <p className="text-zinc-600 text-sm mt-1.5">Try a different search or category</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((item, i) => (
                <FoodCard key={item.id} item={item} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
