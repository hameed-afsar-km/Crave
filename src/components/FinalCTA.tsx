'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Deep background */}
      <div className="absolute inset-0 bg-[#06060A]" />

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80)' }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060A]/90 via-transparent to-[#06060A]/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06060A]/80 via-transparent to-[#06060A]/80" />

      {/* Central large glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(212,175,55,0.12)_0%,rgba(212,175,55,0.04)_40%,transparent_65%)] rounded-full pointer-events-none" />

      {/* Animated ring */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-gold/12 pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-gold/6 pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75 }}
        >
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="inline-flex items-center gap-2.5 px-5 py-2 bg-gold/10 border border-gold/22 rounded-full backdrop-blur-md"
            >
              <Flame className="w-4 h-4 text-gold" />
              <span className="text-gold text-[11px] font-bold uppercase tracking-widest">Fresh • Fast • No Queue</span>
            </motion.div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.0] tracking-tight mb-6">
            Hungry Right Now?
            <br />
            <span className="text-gradient-gold-bright glow-text">
              Let&apos;s Fix That.
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-zinc-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed mb-12">
            Place your order in under 2 minutes. Your food will be hot, fresh, and waiting — exactly when you arrive.
          </p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/menu"
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-gradient-to-r from-gold via-amber-500 to-amber-600 text-white font-bold rounded-full text-lg shadow-2xl shadow-gold/20 hover:shadow-gold/40 hover:scale-[1.04] transition-all duration-300 overflow-hidden w-full sm:w-auto"
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <Flame className="w-5 h-5 relative" />
              <span className="relative">Start Ordering</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 text-zinc-400 hover:text-gold font-semibold text-sm transition-colors group"
            >
              View full menu
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
