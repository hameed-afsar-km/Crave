'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Globe, Phone, ArrowLeft, Flame, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'select' | 'phone'>('select');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const handleGoogleSignIn = () => {
    signIn({ uid: `google_${Date.now()}`, name: 'Google User', email: 'user@gmail.com', phone: '', role: 'customer' });
    router.push('/');
  };

  const handleSendOtp = () => { if (phone.length >= 10) setStep('otp'); };

  const handleVerifyOtp = () => {
    if (otp.length >= 4) {
      signIn({ uid: `phone_${Date.now()}`, name: 'Customer', email: '', phone, role: 'customer' });
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#06060A] flex overflow-hidden relative">
      {/* Full background blob */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_30%_50%,rgba(212,175,55,0.05)_0%,transparent_65%)] pointer-events-none" />

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#14100A] via-[#0a0808] to-[#06060A]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-12"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#06060A]" />

        {/* Animated rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-gold/6 animate-spin-slow" />
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-gold/10"
        />

        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.1)_0%,transparent_65%)] rounded-full" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-8xl font-black text-gradient-gold-bright glow-text tracking-widest mb-4">
              CRAVE
            </h1>
            <p className="text-zinc-500 text-sm tracking-[0.22em] uppercase font-bold mb-12">
              Skip The Queue • Order Smarter
            </p>

            {/* Feature list */}
            <div className="space-y-3.5 text-left max-w-xs mx-auto">
              {[
                'Order in under 2 minutes',
                'Choose your pickup time',
                'Fresh food, zero wait',
              ].map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-gold/12 border border-gold/20 flex items-center justify-center shrink-0">
                    <span className="text-gold text-[10px] font-black">✓</span>
                  </div>
                  <span className="text-zinc-400 text-sm font-medium">{feat}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right auth panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-black text-gradient-gold tracking-widest glow-text-sm">CRAVE</h1>
          </div>

          {/* Card */}
          <div className="rounded-[32px] bg-[rgba(10,9,18,0.7)] backdrop-blur-xl border border-white/[0.07] p-8 shadow-2xl relative overflow-hidden">
            {/* Interior glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] rounded-full pointer-events-none" />

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-xs font-bold uppercase tracking-wider group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </Link>

            <div className="mb-8">
              <div className="flex items-center gap-2.5 mb-2">
                <Flame className="w-5 h-5 text-gold" />
                <h2 className="text-2xl font-black text-white tracking-tight">Welcome to Crave</h2>
              </div>
              <p className="text-zinc-500 text-sm">Sign in to start ordering your favorites</p>
            </div>

            {/* Mode: select */}
            {mode === 'select' && (
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/8 bg-white/3 hover:bg-gold/5 hover:border-gold/25 rounded-2xl font-bold text-sm text-zinc-200 transition-all duration-300"
                >
                  <Globe className="w-4.5 h-4.5 text-gold" />
                  Continue with Google
                </motion.button>

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[11px] uppercase tracking-widest text-zinc-700 font-black">or</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setMode('phone')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-gold/12 hover:shadow-gold/28 transition-all duration-300"
                >
                  <Phone className="w-4.5 h-4.5" />
                  Continue with Phone
                </motion.button>
              </div>
            )}

            {/* Mode: phone */}
            {mode === 'phone' && (
              <div className="space-y-4">
                <button
                  onClick={() => { setMode('select'); setStep('phone'); setOtp(''); }}
                  className="text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-gold transition-colors"
                >
                  ← Other options
                </button>

                {step === 'phone' ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                        Phone Number
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-white/8 focus-within:border-gold/45 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.07)] transition-all bg-[rgba(6,6,10,0.6)]">
                        <span className="flex items-center px-4 bg-white/3 border-r border-white/5 text-zinc-500 text-sm font-black shrink-0">+91</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-sm font-semibold"
                        />
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={handleSendOtp}
                      disabled={phone.length < 10}
                      className="w-full py-4 bg-gradient-to-r from-gold to-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-gold/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Send OTP
                    </motion.button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •"
                        className="w-full px-4 py-4 input-dark rounded-2xl text-center text-3xl tracking-[0.4em] font-black"
                        maxLength={6}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={handleVerifyOtp}
                      disabled={otp.length < 4}
                      className="w-full py-4 bg-gradient-to-r from-gold to-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-gold/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Verify & Sign In
                    </motion.button>
                    <button onClick={() => setStep('phone')} className="w-full text-xs text-zinc-600 hover:text-gold font-bold transition-colors text-center">
                      Change phone number
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Trust indicator */}
            <div className="mt-7 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-zinc-700 font-semibold">
              <Lock className="w-3 h-3" />
              Your data is secure and never shared
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
