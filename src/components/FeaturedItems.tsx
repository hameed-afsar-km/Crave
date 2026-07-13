'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import FoodCard from './FoodCard';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { subscribeMenuItems, subscribeOrders } from '@/lib/firestore-service';
import type { MenuItem, Order } from '@/types';

export default function FeaturedItems() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  useEffect(() => {
    const unsub = subscribeMenuItems((menuItems) => setItems(menuItems));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeOrders((allOrders) => setOrders(allOrders));
    return unsub;
  }, []);

  const featured = useMemo(() => {
    if (items.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      for (const item of order.items || []) {
        const id = item.menuItemId || '';
        if (id) counts[id] = (counts[id] || 0) + (item.quantity || 1);
      }
    }

    const sorted = [...items]
      .map((item) => ({ item, count: counts[item.id] || 0 }))
      .sort((a, b) => b.count - a.count || b.item.rating - a.item.rating);

    const top = sorted.filter((s) => s.count > 0).slice(0, 6);
    if (top.length >= 3) return top.map((s) => s.item);

    return items.slice(0, 6);
  }, [items, orders]);

  const sectionParallax = useTransform(scrollYProgress, [0, 1], ['-18%', '18%']);

  return (
    <section ref={sectionRef} className="py-28 relative overflow-hidden">
      <motion.div style={{ y: sectionParallax }} className="relative">
        <div className="absolute inset-0 bg-[#06060A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(212,175,55,0.03)_0%,transparent_65%)] pointer-events-none" />

        {/* Abstract background shapes */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <span className="absolute top-[12%] left-[8%] text-gold/6 text-[clamp(3rem,6vw,5rem)] font-black leading-none">X</span>
          <span className="absolute top-[8%] right-[14%] text-gold/5 text-[clamp(3rem,6vw,5rem)] font-black leading-none">O</span>
          <span className="absolute bottom-[18%] left-[12%] text-gold/6 text-[clamp(3rem,6vw,5rem)] font-black leading-none">△</span>
          <span className="absolute bottom-[12%] right-[10%] text-gold/5 text-[clamp(3rem,6vw,5rem)] font-black leading-none">+</span>
          <span className="absolute top-[45%] left-[5%] text-gold/4 text-[clamp(2rem,4vw,3.5rem)] font-black leading-none">O</span>
          <span className="absolute top-[38%] right-[6%] text-gold/4 text-[clamp(2rem,4vw,3.5rem)] font-black leading-none">/</span>
        </div>

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
      </motion.div>
    </section>
  );
}
