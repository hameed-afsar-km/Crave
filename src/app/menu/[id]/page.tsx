'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Minus, Plus, ShoppingCart, ArrowLeft, Check, Send } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useAddToCartPopup } from '@/context/AddToCartPopupContext';
import Link from 'next/link';
import { subscribeMenuItems, subscribeReviews, addReview } from '@/lib/firestore-service';
import type { MenuItem, Review } from '@/types';

export default function FoodDetailPage() {
  const params = useParams();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { user } = useAuth();
  const { showPopup } = useAddToCartPopup();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const unsub = subscribeMenuItems((menuItems) => {
      setItems(menuItems);
      setLoading(false);
    });
    return unsub;
  }, []);

  const item = items.find(i => i.id === params.id);

  useEffect(() => {
    if (!item) return;
    const unsub = subscribeReviews(item.id, setReviews);
    return unsub;
  }, [item?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) return notFound();

  const handleAddToCart = () => {
    const addons = (item.addons || []).filter(a => selectedAddons.includes(a.name));
    const addonKey = addons.length > 0 ? addons.map(a => a.name).sort().join('-') : '';
    const optionsKey = addonKey ? `-${addonKey}` : '';
    const addonPriceTotal = addons.reduce((sum, a) => sum + a.price, 0);
    addItem({
      id: `${item.id}${optionsKey}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price + addonPriceTotal,
      quantity,
      image: item.image,
      addons: addons.length > 0 ? addons : undefined,
      inclusiveOfGst: item.inclusiveOfGst,
    });
    showPopup({ name: item.name, image: item.image, price: item.price + addonPriceTotal, category: item.category });
  };

  const toggleAddon = (name: string) => {
    setSelectedAddons(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleSubmitReview = async () => {
    if (!user?.uid || !item) return;
    setReviewSubmitting(true);
    try {
      await addReview({
        menuItemId: item.id,
        userId: user.uid,
        userName: user.name || user.email || 'Anonymous',
        userEmail: user.email || '',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSubmitted(true);
      setReviewComment('');
      setReviewRating(5);
      setTimeout(() => setReviewSubmitted(false), 3000);
    } catch {
      // silently fail
    } finally {
      setReviewSubmitting(false);
    }
  };

  const addons = item.addons || [];
  const selectedAddonTotal = addons
    .filter(a => selectedAddons.includes(a.name))
    .reduce((sum, a) => sum + a.price, 0);

  const totalPrice = item.price + selectedAddonTotal;

  return (
    <div className="min-h-screen bg-[#06060A] pt-32 md:pt-40 pb-20 relative overflow-hidden">
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
                  <span>{item.rating || 'New'}</span>
                  {reviews.length > 0 && (
                    <span className="text-zinc-400">({reviews.length})</span>
                  )}
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

            <div className="text-3xl font-black text-gradient-gold mb-8 tracking-tight flex items-center gap-3">
              {formatPrice(item.price)}
              {item.inclusiveOfGst && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Inclusive of GST
                </span>
              )}
            </div>

            {/* Customize Section */}
            {addons.length > 0 && (
              <div className="border-t border-white/5 pt-6 mb-8">
                <h3 className="font-bold text-white text-base tracking-wide mb-4">Customize Your Order</h3>
                <div className="flex flex-col gap-3">
                  {addons.map(addon => {
                    const isSelected = selectedAddons.includes(addon.name);
                    return (
                      <button
                        key={addon.name}
                        onClick={() => toggleAddon(addon.name)}
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
                          <span className="font-bold text-sm text-zinc-200">{addon.name}</span>
                        </div>
                        {addon.price > 0 && (
                          <span className="text-xs font-black text-gold">+{formatPrice(addon.price)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* Reviews Section */}
            <div className="border-t border-white/5 pt-8 mb-8">
              <h3 className="font-bold text-white text-base tracking-wide mb-5">
                Reviews {reviews.length > 0 && <span className="text-zinc-500 font-normal text-sm">({reviews.length})</span>}
              </h3>

              {/* Write Review */}
              {user?.uid ? (
                <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-5">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Write a Review</p>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-gold text-gold' : 'text-zinc-600'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/30 border border-white/[0.06] rounded-xl text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-gold/40 resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    {reviewSubmitted && (
                      <p className="text-[11px] text-emerald-400 font-semibold">Review submitted!</p>
                    )}
                    <div className="ml-auto">
                      <button
                        onClick={handleSubmitReview}
                        disabled={reviewSubmitting || !reviewComment.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold to-amber-600 text-white text-xs font-black rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-gold/20 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {reviewSubmitting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 mb-5">
                  <Link href="/auth" className="text-gold hover:underline font-semibold">Sign in</Link> to leave a review.
                </p>
              )}

              {/* Review List */}
              {reviews.length === 0 ? (
                <p className="text-sm text-zinc-600">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-2xl border border-white/[0.04] bg-white/[0.015]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                            <span className="text-[10px] font-black text-gold">
                              {(review.userName || 'A')[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-zinc-300">{review.userName}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-gold text-gold' : 'text-zinc-700'}`} />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-xs text-zinc-400 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
