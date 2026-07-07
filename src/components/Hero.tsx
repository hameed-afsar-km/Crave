'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, Clock } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#06060A]" aria-label="Hero banner">

      {/* Background - right side */}
      <div
        className="absolute right-0 top-0 w-full md:w-[55%] h-full bg-cover bg-left opacity-90"
        aria-hidden
        style={{ backgroundImage: "url('/images/crave-hero.webp')" }}
      />

      {/* Dark overlay layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 to-transparent" />

      {/* Large ambient glow center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,175,55,0.09)_0%,rgba(212,175,55,0.04)_40%,transparent_70%)] rounded-full" />
      </div>

      {/* Content */}
      <div
        className="relative z-10 text-left px-5 sm:px-10 md:px-14 max-w-2xl pt-32 md:pt-40 ml-0 md:ml-8 lg:ml-16"
      >
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8 flex items-center gap-3 justify-start"
        >
          <div className="h-px w-8 bg-gold/40" />
          <span className="text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Skip The Queue — Order Online</span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.3 }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[1.02] tracking-tight">
            <span className="block text-white drop-shadow-md">Craving</span>
            <span className="block mt-1 text-gradient-gold-bright glow-text">
              Something Good?
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 text-base md:text-lg text-zinc-400 max-w-lg leading-relaxed"
        >
          Order your favorites in advance, choose a pickup time, and collect fresh food without waiting in line — near LIC Metro, Chennai.
        </motion.p>

        {/* Social proof mini row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-6 flex items-center justify-start gap-6 text-zinc-500 text-xs font-semibold"
        >
          <span className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            4.9 Rating
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gold" />
            ~18 min pickup
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="text-zinc-500">500+ happy orders</span>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="mt-10 flex flex-col sm:flex-row items-start justify-start gap-4"
        >
          <Link
            href="/menu"
            className="group relative inline-flex items-center justify-center gap-2.5 px-9 py-4 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-bold rounded-full text-base shadow-xl shadow-gold/15 hover:shadow-gold/30 hover:scale-[1.03] transition-all duration-300 w-full sm:w-auto overflow-hidden"
          >
            {/* Shine sweep */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <span className="relative">Order Now</span>
            <ArrowRight className="w-4.5 h-4.5 relative group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/menu"
            className="group inline-flex items-center justify-center gap-2.5 px-9 py-4 border border-white/10 hover:border-gold/30 bg-white/4 hover:bg-gold/5 text-white hover:text-gold font-semibold rounded-full text-base backdrop-blur-sm transition-all duration-300 w-full sm:w-auto"
          >
            View Menu
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
