'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Star, Clock } from 'lucide-react';
import { useRef } from 'react';

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  x: `${8 + i * 8}%`,
  y: `${12 + (i % 5) * 18}%`,
  size: i % 3 === 0 ? 'w-2 h-2' : 'w-1.5 h-1.5',
  duration: 3.5 + i * 0.6,
  delay: i * 0.25,
}));

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#06060A]">

      {/* Parallax Background */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 bg-cover bg-center"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=2000&q=80)' }}
        />
      </motion.div>

      {/* Dark overlay layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-[#06060A]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      {/* Large ambient glow center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,175,55,0.09)_0%,rgba(212,175,55,0.04)_40%,transparent_70%)] rounded-full" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className={`absolute ${p.size} rounded-full bg-gradient-to-br from-gold-light to-amber-500`}
            style={{ left: p.x, top: p.y, opacity: 0.25 }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.15, 0.55, 0.15],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center px-5 max-w-5xl mx-auto pt-20"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-7 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gold/8 to-amber-500/8 backdrop-blur-md rounded-full text-gold text-[11px] font-bold uppercase tracking-widest border border-gold/22 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
            </span>
            Skip The Queue — Order Online
          </span>
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
          className="mt-6 text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
        >
          Order your favorites in advance, choose a pickup time, and collect fresh food without waiting in line — near LIC Metro, Chennai.
        </motion.p>

        {/* Social proof mini row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-6 flex items-center justify-center gap-6 text-zinc-500 text-xs font-semibold"
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
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
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

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Scroll</span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4 text-gold/50" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
