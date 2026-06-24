'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, ShoppingBag, ArrowLeft, User, Phone, Mail, CheckCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, generateTimeSlots, generateOrderId } from '@/lib/utils';
import { addDocument } from '@/hooks/useFirestore';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pickupOption, setPickupOption] = useState<'asap' | 'later'>('asap');
  const [selectedTime, setSelectedTime] = useState('');
  const [processing, setProcessing] = useState(false);

  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (pickupOption === 'asap' && timeSlots.length > 0) {
      setSelectedTime(timeSlots[0].time);
    }
  }, [pickupOption]);

  const handlePlaceOrder = async () => {
    if (!name || !phone) return;
    setProcessing(true);
    try {
      const orderId = generateOrderId();
      const order = {
        id: orderId,
        customerId: user?.uid || 'guest',
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
        amount: total,
        pickupTime: selectedTime,
        status: 'received' as const,
        paymentStatus: 'pending',
        estimatedWaitTime: 18,
        createdAt: new Date().toISOString(),
      };

      // Save to order history
      const existing = JSON.parse(localStorage.getItem('crave-orders') || '[]');
      existing.unshift(order);
      localStorage.setItem('crave-orders', JSON.stringify(existing));
      localStorage.setItem('crave-last-order', JSON.stringify(order));

      clearCart();
      router.push(`/order/${orderId}`);
    } catch {
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#06060A] pt-28 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-3">Your cart is empty</h2>
          <Link href="/menu" className="text-gold font-bold hover:underline">Browse Menu</Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3.5 input-dark rounded-xl text-sm font-medium transition-all duration-300";

  return (
    <div className="min-h-screen bg-[#06060A] pt-28 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Back link */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Cart
        </Link>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Checkout</h1>
          <p className="text-zinc-500 text-sm mt-1.5">Fill in your details to complete your order</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
          {/* Form */}
          <div className="lg:col-span-3 space-y-5">

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/18 flex items-center justify-center">
                  <User className="w-4 h-4 text-gold" />
                </div>
                <h2 className="text-base font-black text-white">Contact Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                      Phone *
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-white/8 focus-within:border-gold/45 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.07)] transition-all bg-[rgba(6,6,10,0.6)]">
                      <span className="flex items-center px-4 bg-white/3 border-r border-white/5 text-zinc-500 text-sm font-bold shrink-0">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pickup Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[24px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/18 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gold" />
                </div>
                <h2 className="text-base font-black text-white">Pickup Time</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { key: 'asap', label: 'Pickup ASAP', sub: '~18 min wait' },
                  { key: 'later', label: 'Schedule Later', sub: 'Choose a slot' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPickupOption(opt.key as 'asap' | 'later')}
                    className={`p-4 rounded-2xl border transition-all duration-300 text-left ${
                      pickupOption === opt.key
                        ? 'border-gold/45 bg-gold/6 shadow-[0_0_15px_rgba(212,175,55,0.08)]'
                        : 'border-white/6 bg-white/2 hover:border-white/12'
                    }`}
                  >
                    <p className="font-black text-sm text-white">{opt.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>

              {pickupOption === 'later' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-3 rounded-2xl border border-white/5 bg-black/30"
                >
                  {timeSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-black transition-all duration-200 ${
                        selectedTime === slot.time
                          ? 'bg-gradient-to-r from-gold to-amber-600 text-white shadow-md'
                          : 'bg-zinc-900/50 text-zinc-400 border border-white/5 hover:border-gold/25 hover:text-gold'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </motion.div>
              )}

              {pickupOption === 'asap' && selectedTime && (
                <p className="text-xs text-zinc-500 mt-4 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-gold shrink-0" />
                  Ready at approximately <strong className="text-gold ml-1">{selectedTime}</strong>
                </p>
              )}
            </motion.div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="sticky top-28 rounded-[28px] bg-[rgba(12,9,5,0.72)] backdrop-blur-xl border border-gold/15 p-6 shadow-2xl"
            >
              <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-5">Order Summary</h2>

              {/* Items list */}
              <div className="space-y-3 max-h-52 overflow-y-auto mb-5 pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs gap-3">
                    <span className="text-zinc-400 font-semibold leading-tight">
                      <span className="text-gold font-black">{item.quantity}×</span> {item.name}
                    </span>
                    <span className="font-black text-zinc-200 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="divider-gold mb-4" />

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>Subtotal</span>
                  <span className="font-bold text-zinc-300">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-xs">
                  <span>Tax (5%)</span>
                  <span className="font-bold text-zinc-300">{formatPrice(tax)}</span>
                </div>
              </div>

              <div className="divider-gold mb-4" />

              <div className="flex justify-between items-center mb-8">
                <span className="font-black text-white text-sm">Total Amount</span>
                <span className="text-2xl font-black text-gradient-gold glow-text-sm">{formatPrice(total)}</span>
              </div>

              <motion.button
                onClick={handlePlaceOrder}
                disabled={processing || !name || !phone}
                whileHover={{ scale: processing ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative flex items-center justify-center gap-2.5 w-full py-4 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-black rounded-2xl shadow-lg shadow-gold/12 hover:shadow-gold/28 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm overflow-hidden group"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                {processing ? (
                  <span className="relative flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 relative" />
                    <span className="relative">Place Order • {formatPrice(total)}</span>
                  </>
                )}
              </motion.button>

              <p className="text-center text-[10px] text-zinc-700 mt-3 font-semibold tracking-wide">
                Pay at pickup • No advance payment required
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
