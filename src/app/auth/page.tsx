'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Globe, ArrowLeft, Flame, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import { logAction } from '@/lib/audit';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@crave.com';

export default function AuthPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      if (!auth) {
        setError('Firebase authentication is not available. Please check your configuration.');
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        setError('Google account must have an email address.');
        return;
      }

      const isAdmin = firebaseUser.email === ADMIN_EMAIL;

      signIn({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || '',
        role: isAdmin ? 'admin' : 'customer',
      });

      if (isAdmin) {
        logAction('admin.login', 'auth', firebaseUser.uid, { provider: 'google' }, { email: firebaseUser.email, role: 'admin', name: firebaseUser.displayName || '' });
      }

      router.push(isAdmin ? '/admin/dashboard' : '/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
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

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/8 bg-white/3 hover:bg-gold/5 hover:border-gold/25 rounded-2xl font-bold text-sm text-zinc-200 transition-all duration-300"
            >
              <Globe className="w-4.5 h-4.5 text-gold" />
              Continue with Google
            </motion.button>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
                {error}
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
