'use client';

import { useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, Minus, Plus, ShoppingCart, ArrowLeft, Check } from 'lucide-react';
import { menuItems } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

const extras = [
  { label: 'Extra Cheese', price: 30 },
  { label: 'Extra Spicy', price: 0 },
  { label: 'No Onion', price: 0 },
];

export default function FoodDetailPage() {
  const params = useParams();
  const item = menuItems.find(i => i.id === params.id);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  if (!item) return notFound();

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
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
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="sticky top-24">
              <div className="relative rounded-3xl overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-orange-500 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {item.rating}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="pb-24"
          >
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-sm font-medium rounded-full mb-3">
              {item.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{item.name}</h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">{item.description}</p>

            <div className="text-3xl font-bold text-orange-500 mb-8">
              {formatPrice(item.price)}
            </div>

            <div className="border-t border-gray-100 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Customize Your Order</h3>
              <div className="flex flex-col gap-3">
                {extras.map(extra => (
                  <button
                    key={extra.label}
                    onClick={() => toggleExtra(extra.label)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      selectedExtras.includes(extra.label)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        selectedExtras.includes(extra.label)
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedExtras.includes(extra.label) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{extra.label}</span>
                    </div>
                    {extra.price > 0 && (
                      <span className="text-sm text-gray-500">+{formatPrice(extra.price)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-orange-300 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-orange-300 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 md:relative bg-white border-t md:border-t-0 border-gray-100 p-4 md:p-0 z-30">
              <div className="max-w-6xl mx-auto flex items-center gap-4">
                <div className="hidden md:block flex-1">
                  <p className="text-sm text-gray-500">Total Price</p>
                  <p className="text-2xl font-bold text-orange-500">{formatPrice(totalPrice * quantity)}</p>
                </div>
                <motion.button
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart - {formatPrice(totalPrice * quantity)}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
