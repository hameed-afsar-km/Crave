'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, ShoppingBag, ArrowLeft, User, Mail, CheckCircle, ArrowRight, Store, Ban } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, generateTimeSlots } from '@/lib/utils';
import { loadSettings, getTimeUntilOpen } from '@/lib/store';
import { loadRazorpayScript } from '@/lib/razorpay';
import { createOrder } from '@/lib/firestore-service';
import StoreStatusBanner from '@/components/StoreStatusBanner';
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
  const [phoneError, setPhoneError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [storeStatus, setStoreStatus] = useState(() => loadSettings());
  const [timeUntilOpen, setTimeUntilOpen] = useState('');

  useEffect(() => {
    const update = () => {
      const s = loadSettings();
      setStoreStatus(s);
      setTimeUntilOpen(getTimeUntilOpen());
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const canOrder = storeStatus.storeOpen && storeStatus.acceptingOrders;

  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const timeSlots = generateTimeSlots(storeStatus.openingTime, storeStatus.closingTime);

  useEffect(() => {
    if (pickupOption === 'asap' && timeSlots.length > 0) {
      setSelectedTime(timeSlots[0].time);
    }
  }, [pickupOption]);

  const isPhoneValid = /^\d{10}$/.test(phone);

  const [paymentError, setPaymentError] = useState('');

  const handlePlaceOrder = async () => {
    if (!name || !phone || !isPhoneValid) return;
    const latest = loadSettings();
    if (!latest.storeOpen || !latest.acceptingOrders) { setStoreStatus(latest); return; }
    setProcessing(true);
    setPaymentError('');
    try {
      const settings = loadSettings();
      const pointsEarned = Math.floor(total / settings.earnRate);

      // 1. Create Razorpay order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });
      const razorpayOrder = await res.json();
      if (!res.ok || !razorpayOrder.id) {
        throw new Error(razorpayOrder.error || 'Failed to initiate payment');
      }

      // 2. Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load payment gateway. Please try again.');
      }

      // 3. Open Razorpay checkout
      const options: any = {
        key: razorpayOrder.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Crave Express',
        description: `Order • ${formatPrice(total)}`,
        order_id: razorpayOrder.id,
        prefill: {
          name,
          email: email || '',
          contact: phone,
        },
        theme: { color: '#D4AF37' },
        handler: async function (response: any) {
          // 4. Verify payment server-side
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyData.verified) {
              setPaymentError('Payment verification failed. Please contact support.');
              setProcessing(false);
              return;
            }

            // 5. Create Firestore order
            const orderData = {
              customerId: user?.uid || 'guest',
              customerName: name,
              customerPhone: phone,
              customerEmail: email,
              items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
              amount: total,
              paymentStatus: 'paid' as const,
              paymentId: response.razorpay_payment_id,
              pickupTime: selectedTime,
              status: 'received' as const,
              estimatedWaitTime: 18,
              pointsEarned,
            };

            const orderId = await createOrder(orderData);

            const order: any = { ...orderData, id: orderId, createdAt: new Date().toISOString() };

            clearCart();
            setConfirmedOrder(order);
            setConfirmedOrderId(orderId);
            setShowConfirmation(true);
          } catch {
            setPaymentError('Payment successful but order creation failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setPaymentError('Payment cancelled. You can try again.');
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setPaymentError(err?.message || 'Failed to place order. Please try again.');
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

        <div className="mb-6">
          <StoreStatusBanner />
        </div>

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
                    <div className={`flex rounded-xl overflow-hidden border transition-all bg-[rgba(6,6,10,0.6)] ${
                        phoneError ? 'border-rose-500/40 focus-within:border-rose-400 focus-within:shadow-[0_0_0_3px_rgba(244,63,94,0.1)]' : 'border-white/8 focus-within:border-gold/45 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.07)]'
                      }`}>
                      <span className="flex items-center px-4 bg-white/3 border-r border-white/5 text-zinc-500 text-sm font-bold shrink-0">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) {
                            setPhone(val);
                            if (val.length === 10) setPhoneError('');
                            else if (val.length > 0) setPhoneError('Phone must be 10 digits');
                            else setPhoneError('');
                          }
                        }}
                        placeholder="98765 43210"
                        className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-sm font-semibold"
                      />
                    </div>
                    {phoneError && (
                      <p className="text-[10px] text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-rose-400" />
                        {phoneError}
                      </p>
                    )}
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
                  <span>GST (18%)</span>
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
                disabled={processing || !name || !phone || !isPhoneValid || !canOrder}
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
              {!canOrder && (
                <p className="text-center text-[11px] text-rose-400/80 mt-3 font-semibold">
                  {!storeStatus.storeOpen ? 'Store is currently closed' : 'Orders are temporarily paused'}
                </p>
              )}

              {paymentError && (
                <p className="text-center text-[11px] text-rose-400 font-semibold mt-3">{paymentError}</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Store Closed / Paused Modal ── */}
      <AnimatePresence>
        {!canOrder && !showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => {}} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className="relative bg-[rgba(12,9,5,0.95)] backdrop-blur-2xl border border-gold/15 rounded-[32px] p-8 md:p-10 w-full max-w-sm text-center"
            >
              <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                {!storeStatus.storeOpen ? <Store className="w-10 h-10 text-amber-400" /> : <Ban className="w-10 h-10 text-amber-400" />}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                {!storeStatus.storeOpen ? 'Store Closed' : 'Orders Paused'}
              </h2>
              <p className="text-zinc-400 text-sm mb-2 leading-relaxed">
                {!storeStatus.storeOpen
                  ? 'The store is currently closed. Please check back during operating hours.'
                  : 'We are not accepting orders at the moment. Your cart has been saved — come back soon!'}
              </p>
              {timeUntilOpen && (
                <p className="text-gold font-black text-sm mb-6">{timeUntilOpen}</p>
              )}
              <Link
                href="/menu"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-amber-600 text-white font-black rounded-2xl shadow-lg shadow-gold/15 hover:shadow-gold/30 transition-all text-sm"
              >
                Browse Menu
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Confirmation Overlay ── */}
      <AnimatePresence>
        {showConfirmation && confirmedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              className="relative bg-[rgba(12,9,5,0.95)] backdrop-blur-2xl border border-gold/15 rounded-[32px] p-8 md:p-10 w-full max-w-md shadow-[0_0_80px_rgba(212,175,55,0.1)] text-center overflow-hidden"
            >
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, (i % 2 === 0 ? -1 : 1) * (60 + Math.random() * 40)],
                    y: [0, (i < 3 ? -1 : 1) * (60 + Math.random() * 40)],
                  }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 1.2, ease: 'easeOut' }}
                  className="absolute w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                  style={{
                    left: '50%',
                    top: '50%',
                    marginLeft: -4,
                    marginTop: -4,
                  }}
                />
              ))}

              {/* Animated Check */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 250, damping: 15, delay: 0.15 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold/30"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-black text-white tracking-tight mb-1"
              >
                Order Placed!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-zinc-400 text-sm mb-6"
              >
                Your order has been received successfully.
              </motion.p>

              {/* Order ID + Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-black/40 rounded-2xl border border-white/5 p-5 mb-6 space-y-3"
              >
                <div className="text-center">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Order ID</p>
                  <p className="text-sm font-black text-gold">{confirmedOrderId}</p>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400 font-semibold">Items</span>
                  <span className="text-white font-bold">{confirmedOrder.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400 font-semibold">Pickup</span>
                  <span className="text-white font-bold">{confirmedOrder.pickupTime}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-white/5">
                  <span className="text-white font-black">Total</span>
                  <span className="text-lg font-black text-gradient-gold">{formatPrice(confirmedOrder.amount)}</span>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <Link
                  href={`/order/${confirmedOrderId}`}
                  onClick={() => setShowConfirmation(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-gold to-amber-600 text-white font-black rounded-2xl shadow-lg shadow-gold/15 hover:shadow-gold/30 transition-all text-sm"
                >
                  View Order
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/menu"
                  onClick={() => setShowConfirmation(false)}
                  className="block text-sm font-bold text-zinc-500 hover:text-gold transition-colors"
                >
                  Continue Shopping
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
