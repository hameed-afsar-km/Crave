'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Star, Plus, ShoppingCart } from 'lucide-react';
import { MenuItem } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

interface FoodCardProps {
  item: MenuItem;
  index?: number;
  compact?: boolean;
}

export default function FoodCard({ item, index = 0, compact }: FoodCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link href={`/menu/${item.id}`}>
        <div className="bg-gray-950 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-800">
          <div className="relative overflow-hidden aspect-[4/3]">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-orange-400">
              ★ {item.rating}
            </div>
            {!compact && (
              <motion.button
                onClick={handleAddToCart}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-3 right-3 w-9 h-9 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-orange-400 hover:bg-orange-500 hover:text-white transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-100 text-lg group-hover:text-orange-400 transition-colors">
              {item.name}
            </h3>
            {!compact && (
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold text-orange-400">{formatPrice(item.price)}</span>
              {compact && (
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-full hover:bg-orange-600 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
