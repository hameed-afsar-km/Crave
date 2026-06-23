'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, generateTimeSlots, generateOrderId } from '@/lib/utils';
import { addDocument } from '@/hooks/useFirestore';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
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

      await addDocument('orders', {
        id: orderId,
        customerId: user?.uid || 'guest',
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        items,
        amount: total,
        pickupTime: selectedTime,
        status: 'received',
        paymentStatus: 'pending',
        paymentId: '',
        estimatedWaitTime: 18,
        orderId,
      });

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
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
          <Link href="/menu" className="text-orange-500 hover:underline mt-2 inline-block">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-500 mb-8">Complete your order</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pickup Time</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPickupOption('asap')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    pickupOption === 'asap'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                  <span className="font-semibold text-sm">Pickup ASAP</span>
                  <p className="text-xs text-gray-500 mt-1">~18 min wait</p>
                </button>
                <button
                  onClick={() => setPickupOption('later')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    pickupOption === 'later'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Clock className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                  <span className="font-semibold text-sm">Pickup Later</span>
                  <p className="text-xs text-gray-500 mt-1">Choose a time</p>
                </button>
              </div>

              {pickupOption === 'later' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedTime === slot.time
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-500'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}

              {pickupOption === 'asap' && selectedTime && (
                <p className="text-sm text-gray-500 mt-3">
                  Your order will be ready for pickup at approximately{' '}
                  <span className="font-semibold text-gray-900">{selectedTime}</span>
                </p>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Tax (5%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-orange-500">{formatPrice(total)}</span>
                </div>
              </div>

              <motion.button
                onClick={handlePlaceOrder}
                disabled={processing || !name || !phone}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  'Placing Order...'
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Place Order — {formatPrice(total)}
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
