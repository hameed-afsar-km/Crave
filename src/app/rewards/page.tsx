'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Gift, Star, ArrowLeft, ShoppingBag, CheckCircle, Zap, Coffee, Sandwich, Pizza } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { loadSettings, RewardConfig } from '@/lib/store';
import Link from 'next/link';

const rewardIcons: Record<string, React.ReactNode> = {
  fries: <Coffee className="w-5 h-5" />,
  'cold-drink': <Coffee className="w-5 h-5" />,
  wrap: <Sandwich className="w-5 h-5" />,
  shawarma: <Pizza className="w-5 h-5" />,
  combo: <ShoppingBag className="w-5 h-5" />,
};

export default function RewardsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    setPoints(parseInt(localStorage.getItem('crave-points') || '0', 10));
    const saved = JSON.parse(localStorage.getItem('crave-redeemed') || '[]');
    setRedeemed(saved);
  }, []);

  const storeSettings = loadSettings();
  const earnRate = storeSettings.earnRate || 10;
  const rewards = (storeSettings.rewards || []).filter(r => r.available);

  if (loading || !user) return null;

  const handleRedeem = (reward: RewardConfig) => {
    if (points < reward.cost) return;

    const newPoints = points - reward.cost;
    setPoints(newPoints);
    localStorage.setItem('crave-points', String(newPoints));

    const newRedeemed = [...redeemed, reward.id];
    setRedeemed(newRedeemed);
    localStorage.setItem('crave-redeemed', JSON.stringify(newRedeemed));

    setMessage({ type: 'success', text: `${reward.name} redeemed! Show this at the counter.` });
    setTimeout(() => setMessage(null), 4000);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-[#06060A] pt-28 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        {/* Points hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[28px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6 md:p-8 mb-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_65%)] rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-white/5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-xl shadow-gold/15 border border-white/10">
                <Gift className="w-9 h-9 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Rewards</h1>
              <p className="text-zinc-500 text-sm mt-1">Redeem your loyalty points for free items</p>
            </div>
          </div>

          {/* Points balance */}
          <div className="mt-6 flex items-center justify-center sm:justify-start gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Your Balance</p>
              <motion.p
                key={points}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl md:text-5xl font-black text-gradient-gold glow-text-sm"
              >
                {points}
              </motion.p>
              <p className="text-xs text-zinc-600 font-semibold mt-1">loyalty points</p>
            </div>
            <div className="h-16 w-px bg-white/5 hidden sm:block" />
            <div className="text-center hidden sm:block">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Earn Rate</p>
              <p className="text-lg font-black text-zinc-200">₹{earnRate} = 1 pt</p>
              <p className="text-xs text-zinc-600 font-semibold mt-1">on every order</p>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55 }}
          className="rounded-[28px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6 md:p-8 mb-5"
        >
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gold/8 border border-gold/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-gold" />
            </div>
            <h2 className="text-base font-black text-white">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Order', desc: 'Place an order from our menu' },
              { step: '2', title: 'Earn', desc: `Get 1 point for every ₹${earnRate} spent` },
              { step: '3', title: 'Redeem', desc: 'Swap points for free food below' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3.5 p-4 bg-black/30 border border-white/5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <span className="text-gold font-black text-sm">{s.step}</span>
                </div>
                <div>
                  <p className="font-black text-white text-sm">{s.title}</p>
                  <p className="text-xs text-zinc-500 font-semibold mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Redeemable rewards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="rounded-[28px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-6 md:p-8"
        >
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gold/8 border border-gold/15 flex items-center justify-center">
              <Star className="w-4 h-4 text-gold" />
            </div>
            <h2 className="text-base font-black text-white">Redeem Points</h2>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-4 rounded-2xl mb-4 text-sm font-bold ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              {message.text}
            </motion.div>
          )}

          <div className="space-y-3">
            {rewards.map((reward) => {
              const alreadyRedeemed = redeemed.includes(reward.id);
              const canAfford = points >= reward.cost;

              return (
                <motion.div
                  key={reward.id}
                  variants={itemAnim}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    alreadyRedeemed
                      ? 'bg-black/30 border-emerald-500/15 opacity-60'
                      : canAfford
                      ? 'bg-black/30 border-white/5 hover:border-gold/20 hover:bg-gold/[0.02]'
                      : 'bg-black/30 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      alreadyRedeemed
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-gold/8 border border-gold/15 text-gold'
                    }`}>
                      {rewardIcons[reward.id] || <Gift className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{reward.name}</p>
                      <p className="text-xs text-zinc-500 font-semibold mt-0.5">{reward.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-black text-gold">{reward.cost} pts</p>
                    {alreadyRedeemed ? (
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Redeemed</span>
                    ) : (
                      <motion.button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canAfford}
                        whileHover={canAfford ? { scale: 1.03 } : {}}
                        whileTap={canAfford ? { scale: 0.97 } : {}}
                        className={`mt-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-gold to-amber-600 text-white cursor-pointer'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                      >
                        Redeem
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {rewards.length === 0 && (
            <p className="text-zinc-600 text-center py-10 font-semibold text-sm">No rewards available yet.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
