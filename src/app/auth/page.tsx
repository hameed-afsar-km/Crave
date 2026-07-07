'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Globe, ArrowLeft, Flame, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import Link from 'next/link';

function handleUser(
  result: { user: { uid: string; displayName: string | null; email: string | null; phoneNumber: string | null } },
  signIn: (user: UserProfile) => void,
  router: ReturnType<typeof useRouter>
) {
  const firebaseUser = result.user;
  if (!firebaseUser.email) return 'Google account must have an email address.';
  signIn({
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || 'Google User',
    email: firebaseUser.email,
    phone: firebaseUser.phoneNumber || '',
    role: 'customer',
  });
  router.push('/');
  return null;
}

export default function AuthPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRedirect, setUseRedirect] = useState(false);

  // Handle redirect result on mount
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth).then((result) => {
      if (result) {
        const err = handleUser(result, signIn, router);
        if (err) setError(err);
      }
    }).catch((err: unknown) => {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr?.code !== 'auth/internal-error') {
        console.error('[Auth] Redirect result:', fbErr?.code, fbErr?.message);
      }
    });
  }, [signIn, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      if (!auth) {
        setError('Firebase Auth is not initialized. Check your .env.local configuration.');
        return;
      }
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const err = handleUser(result, signIn, router);
      if (err) setError(err);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string; customData?: Record<string, unknown> };
      // Popup sign-in fails when third-party cookies are blocked (common in incognito/privacy modes).
      // Fall back to redirect immediately — no need to show the user an error.
      if (fbErr?.code === 'auth/internal-error' || fbErr?.code === 'auth/popup-blocked') {
        try { await handleGoogleRedirect(); } catch { /* redirect navigates away */ }
        return;
      }
      console.error('[Auth] Error:', fbErr?.code, fbErr?.message, fbErr?.customData || '');
      setError(`Sign-in failed (${fbErr?.code || 'unknown'}).`);
      setUseRedirect(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    if (!auth) {
      setError('Firebase Auth is not initialized.');
      return;
    }
    setError('');
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  return (
    <div className="min-h-screen bg-[#06060A] flex overflow-hidden relative">
      {/* Full background blob */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_30%_50%,rgba(212,175,55,0.05)_0%,transparent_65%)] pointer-events-none" />

      {/* ── Left branding panel ── */}
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
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-black text-gradient-gold tracking-widest glow-text-sm">CRAVE</h1>
          </div>

          <div className="rounded-[32px] bg-[rgba(10,9,18,0.7)] backdrop-blur-xl border border-white/[0.07] p-8 shadow-2xl relative overflow-hidden">
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/8 bg-white/3 hover:bg-gold/5 hover:border-gold/25 rounded-2xl font-bold text-sm text-zinc-200 transition-all duration-300 disabled:opacity-50"
            >
              <Globe className="w-4.5 h-4.5 text-gold" />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </motion.button>

            {useRedirect && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={handleGoogleRedirect}
                className="w-full flex items-center justify-center gap-3 py-3 border border-white/8 bg-white/3 hover:bg-gold/5 hover:border-gold/25 rounded-2xl font-bold text-xs text-zinc-400 transition-all duration-300 mt-3"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                Try alternate sign-in (redirect)
              </motion.button>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
                {error}
              </div>
            )}

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
