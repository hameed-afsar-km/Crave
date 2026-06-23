'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Globe, Phone, ArrowLeft } from 'lucide-react';
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
    signIn({
      uid: `google_${Date.now()}`,
      name: 'Google User',
      email: 'user@gmail.com',
      phone: '',
      role: 'customer',
    });
    router.push('/');
  };

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      setStep('otp');
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length >= 4) {
      signIn({
        uid: `phone_${Date.now()}`,
        name: 'Customer',
        email: '',
        phone,
        role: 'customer',
      });
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-orange-500 to-red-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold mb-4"
          >
            CRAVE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/80"
          >
            Skip The Queue. Order Smarter.
          </motion.p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Crave</h2>
          <p className="text-gray-500 mb-8">Sign in to start ordering</p>

          {mode === 'select' && (
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl font-medium hover:border-orange-300 hover:bg-orange-50 transition-all"
              >
                <Globe className="w-5 h-5" />
                Continue with Google
              </motion.button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('phone')}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Phone className="w-5 h-5" />
                Continue with Phone
              </motion.button>
            </div>
          )}

          {mode === 'phone' && (
            <div className="space-y-4">
              <button
                onClick={() => { setMode('select'); setStep('phone'); }}
                className="text-sm text-gray-500 hover:text-orange-500 transition-colors mb-2"
              >
                ← Other options
              </button>

              {step === 'phone' ? (
                <>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-gray-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendOtp}
                    disabled={phone.length < 10}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium disabled:opacity-50 transition-all"
                  >
                    Send OTP
                  </motion.button>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 text-center text-2xl tracking-widest"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyOtp}
                    disabled={otp.length < 4}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium disabled:opacity-50 transition-all"
                  >
                    Verify & Sign In
                  </motion.button>
                  <button
                    onClick={() => setStep('phone')}
                    className="w-full text-sm text-gray-500 hover:text-orange-500 transition-colors"
                  >
                    Change phone number
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
