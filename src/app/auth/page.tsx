'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Globe, ArrowLeft, Flame, Lock, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/google-auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);
    try {
      const u = await signInWithGoogle();
      signIn({
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        phone: u.phoneNumber,
      });
      router.replace('/');
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'signin') {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }
      const u = result.user;
      signIn({
        uid: u.uid,
        name: u.displayName || email.split('@')[0],
        email: u.email || email,
        phone: u.phoneNumber || '',
      });
      router.replace('/');
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#06060A] flex overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_30%_50%,rgba(212,175,55,0.05)_0%,transparent_65%)] pointer-events-none" />

      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#14100A] via-[#0a0808] to-[#06060A]" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-12"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#06060A]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-gold/6 animate-spin-slow" />
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-gold/10"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.1)_0%,transparent_65%)] rounded-full" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-14 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-8xl font-black text-gradient-gold-bright glow-text tracking-widest mb-4">CRAVE</h1>
            <p className="text-zinc-500 text-sm tracking-[0.22em] uppercase font-bold mb-12">Skip The Queue • Order Smarter</p>
            <div className="space-y-3.5 text-left max-w-xs mx-auto">
              {['Order in under 2 minutes', 'Choose your pickup time', 'Fresh food, zero wait'].map((feat, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.12 }} className="flex items-center gap-3">
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

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-black text-gradient-gold tracking-widest glow-text-sm">CRAVE</h1>
          </div>

          <div className="rounded-[32px] bg-[rgba(10,9,18,0.7)] backdrop-blur-xl border border-white/[0.07] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] rounded-full pointer-events-none" />

            <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-xs font-bold uppercase tracking-wider group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />Back to Home
            </Link>

            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Flame className="w-5 h-5 text-gold" />
                <h2 className="text-2xl font-black text-white tracking-tight">Welcome to Crave</h2>
              </div>
              <p className="text-zinc-500 text-sm">Sign in to start ordering your favorites</p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/8 bg-white/3 hover:bg-gold/5 hover:border-gold/25 rounded-2xl font-bold text-sm text-zinc-200 transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Globe className="w-4 h-4 text-gold" />
              {loading ? 'Signing in…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-zinc-600 text-xs font-semibold">or</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Email / Password form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/4 border border-white/8 text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-gold/30 focus:bg-gold/3 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/4 border border-white/8 text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none focus:border-gold/30 focus:bg-gold/3 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-black text-sm transition-all hover:brightness-110 hover:scale-[1.015] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-xs text-zinc-600 mt-4">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                className="text-gold hover:underline font-semibold"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-zinc-700 font-semibold">
              <Lock className="w-3 h-3" />Your data is secure and never shared
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
