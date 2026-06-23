'use client';

import { motion } from 'framer-motion';
import { menuItems } from '@/lib/data';
import FoodCard from './FoodCard';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';

export default function FeaturedItems() {
  const featured = menuItems.filter(i => i.rating >= 4.5).slice(0, 6);

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#06060A]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(212,175,55,0.03)_0%,transparent_65%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/8 text-gold text-[10px] font-bold rounded-full border border-gold/18 uppercase tracking-widest mb-4">
              <Flame className="w-3 h-3" />
              Fan Favorites
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Most Ordered <span className="text-gradient-gold">Right Now</span>
            </h2>
            <p className="text-zinc-500 text-base mt-3 max-w-sm leading-relaxed">
              The crowd&apos;s top picks — freshly made and flying off the kitchen.
            </p>
          </div>

          <Link
            href="/menu"
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-gold transition-colors shrink-0"
          >
            Full menu
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((item, i) => (
            <FoodCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
