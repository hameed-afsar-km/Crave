'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.55, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -7 }}
      className="group"
    >
      <Link href={`/menu/${item.id}`}>
        <div className="relative rounded-[26px] overflow-hidden border border-white/[0.06] bg-[rgba(10,9,18,0.7)] backdrop-blur-lg shadow-2xl transition-all duration-500 group-hover:border-gold/28 group-hover:shadow-[0_8px_40px_rgba(212,175,55,0.12)]">

          {/* Image section */}
          <div className="relative overflow-hidden aspect-[4/3] m-2 rounded-[20px]">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-107 transition-transform duration-700"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

            {/* Rating badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/65 backdrop-blur-lg px-2.5 py-1 rounded-full border border-white/8">
              <Star className="w-3 h-3 fill-gold text-gold" />
              <span className="text-[11px] font-black text-white">{item.rating}</span>
            </div>

            {/* Add to cart (non-compact) */}
            {!compact && (
              <motion.button
                onClick={handleAddToCart}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-3 right-3 w-9 h-9 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-gold border border-gold/18 hover:bg-gold hover:text-white hover:border-gold hover:shadow-[0_0_12px_rgba(212,175,55,0.4)] transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            )}

            {/* Category tag */}
            {item.category && (
              <div className="absolute bottom-3 left-3 px-2.5 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-wide border border-white/6">
                {item.category}
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="px-5 pb-5 pt-3">
            <h3 className="font-black text-white text-[16px] leading-tight group-hover:text-gold transition-colors duration-300 mb-1">
              {item.name}
            </h3>

            {!compact && (
              <p className="text-zinc-500 text-[13px] mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-4">
              <div>
                <span className="text-xl font-black text-gradient-gold glow-text-sm tracking-tight">
                  {formatPrice(item.price)}
                </span>
              </div>

              {compact ? (
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-gold to-amber-600 hover:from-amber-500 hover:to-gold text-white text-[11px] font-black rounded-full shadow-md shadow-gold/10 transition-all duration-300"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add
                </motion.button>
              ) : (
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                  View Details →
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
