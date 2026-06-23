'use client';

import { motion } from 'framer-motion';
import { menuItems } from '@/lib/data';
import FoodCard from './FoodCard';

export default function FeaturedItems() {
  const featured = menuItems.filter(i => i.rating >= 4.5).slice(0, 6);

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 text-sm font-medium rounded-full mb-4">
            Featured Items
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Most Ordered Items
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Our best sellers that everyone loves
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((item, i) => (
            <FoodCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
