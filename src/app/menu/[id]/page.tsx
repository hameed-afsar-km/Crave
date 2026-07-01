'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Minus, Plus, ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { subscribeMenuItems } from '@/lib/firestore-service';
import type { MenuItem } from '@/types';

const extras = [
  { label: 'Extra Cheese', price: 30 },
  { label: 'Extra Spicy', price: 0 },
  { label: 'No Onion', price: 0 },
];

export default function FoodDetailPage() {
  const params = useParams();
  const [items, setItems] = useState<MenuItem[]>([]);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeMenuItems((menuItems) => {
      setItems(menuItems);
    });
    return unsub;
  }, []);

  const item = items.find(i => i.id === params.id);

  if (!item) return notFound();

  const handleAddToCart = () => {
    const optionsKey = selectedExtras.length > 0 ? `-${[...selectedExtras].sort().join('-')}` : '';
    addItem({
      id: `${item.id}${optionsKey}`,
      menuItemId: item.id,
      name: item.name,
      price: totalPrice,
      quantity,
      image: item.image,
      options: selectedExtras,
    });
  };

  const toggleExtra = (label: string) => {
    setSelectedExtras(prev =>
      prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label]
    );
  };

  const totalPrice = item.price + selectedExtras.reduce((sum, e) => {
    const extra = extras.find(x => x.label === e);
    return sum + (extra?.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#06060A] pt-28 pb-20 relative overflow-hidden">
      {/* Dynamic ambient lights */}
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(184,150,15,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors mb-8 text-sm font-semibold tracking-wide"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Item Image Sticky Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="sticky top-28">
              <div className="relative rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={600}
                  height={600}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Translucent Rating Badge */}
                <div className="absolute top-4 left-4 bg-black/60 border border-gold/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-gold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <span>{item.rating}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details & Customization Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="pb-24"
          >
            <span className="inline-block px-3 py-1 bg-gold/8 text-gold text-[10px] font-black rounded-full mb-4 border border-gold/20 uppercase tracking-widest">
              {item.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">{item.name}</h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-6">{item.description}</p>

            <div className="text-3xl font-black text-gradient-gold mb-8 tracking-tight">
              {formatPrice(item.price)}
            </div>

            {/* Customize Section */}
            <div className="border-t border-white/5 pt-6 mb-8">
              <h3 className="font-bold text-white text-base tracking-wide mb-4">Customize Your Order</h3>
              <div className="flex flex-col gap-3">
                {extras.map(extra => {
                  const isSelected = selectedExtras.includes(extra.label);
                  return (
                    <button
                      key={extra.label}
                      onClick={() => toggleExtra(extra.label)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                        isSelected
                          ? 'border-gold/40 bg-gold/[0.04] shadow-[0_0_15px_rgba(212,175,55,0.06)]'
                          : 'border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? 'border-gold bg-gold text-black'
                            : 'border-white/20 bg-black/40'
                        }`}>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 stroke-[3.5px] text-black" />
                          )}
                        </div>
                        <span className="font-bold text-sm text-zinc-200">{extra.label}</span>
                      </div>
                      {extra.price > 0 && (
                        <span className="text-xs font-black text-gold">+{formatPrice(extra.price)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="border-t border-white/5 pt-6 mb-8">
              <h3 className="font-bold text-white text-base tracking-wide mb-4">Quantity</h3>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex items-center justify-center hover:border-gold/45 hover:text-gold hover:bg-gold/8 hover:shadow-[0_0_12px_rgba(212,175,55,0.1)] transition-all duration-300"
                >
                  <Minus className="w-4 h-4 text-zinc-300" />
                </button>
                <span className="text-xl font-bold w-6 text-center text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-11 h-11 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex items-center justify-center hover:border-gold/45 hover:text-gold hover:bg-gold/8 hover:shadow-[0_0_12px_rgba(212,175,55,0.1)] transition-all duration-300"
                >
                  <Plus className="w-4 h-4 text-zinc-300" />
                </button>
              </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 md:relative bg-[rgba(10,9,16,0.85)] backdrop-blur-xl border-t md:border-t-0 border-white/[0.06] p-5 md:p-0 z-30">
              <div className="max-w-6xl mx-auto flex items-center gap-6">
                <div className="hidden md:block flex-1">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Total Price</p>
                  <p className="text-2xl font-black text-gradient-gold tracking-tight">{formatPrice(totalPrice * quantity)}</p>
                </div>
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-full shadow-lg shadow-gold/10 hover:shadow-gold/25 transition-all duration-300 hover:brightness-110"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart — {formatPrice(totalPrice * quantity)}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
