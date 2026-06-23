'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { testimonials } from '@/lib/data';

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const navigate = useCallback((dir: number) => {
    setDirection(dir);
    setCurrent(prev => {
      if (dir === 1) return (prev + 1) % testimonials.length;
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => navigate(1), 5500);
    return () => clearInterval(t);
  }, [navigate, paused]);

  const t = testimonials[current];

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060A] via-[#090912] to-[#06060A]" />
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/8 text-gold text-[10px] font-bold rounded-full border border-gold/18 uppercase tracking-widest mb-5">
            <span className="w-1 h-1 rounded-full bg-gold" />
            Customer Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            What People Are{' '}
            <span className="text-gradient-gold">Saying</span>
          </h2>
        </motion.div>

        {/* Testimonial card area */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex items-center gap-5 md:gap-8">
            {/* Prev */}
            <button
              onClick={() => navigate(-1)}
              className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border border-white/8 bg-white/3 hover:border-gold/35 hover:bg-gold/8 hover:text-gold text-zinc-500 items-center justify-center transition-all duration-300 group"
            >
              <ChevronLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Card */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -60 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="relative rounded-[32px] overflow-hidden"
                >
                  {/* Card glass bg */}
                  <div className="absolute inset-0 bg-[rgba(12,10,20,0.7)] backdrop-blur-xl border border-gold/12 rounded-[32px]" />
                  {/* Corner glow */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_65%)] rounded-full pointer-events-none" />

                  <div className="relative z-10 p-8 md:p-14">
                    {/* Large decorative quote */}
                    <Quote className="w-10 h-10 text-gold/8 mb-6" />

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4.5 h-4.5 ${i < t.rating ? 'text-gold fill-gold drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]' : 'text-zinc-800'}`}
                        />
                      ))}
                      <span className="ml-2 text-xs font-black text-gold/70">{t.rating}.0</span>
                    </div>

                    {/* Review text */}
                    <blockquote className="text-lg md:text-xl text-zinc-200 leading-relaxed font-medium italic mb-8">
                      &ldquo;{t.review}&rdquo;
                    </blockquote>

                    {/* Reviewer */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center text-sm font-black text-white shadow-md shadow-gold/20">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-wide">{t.name}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mt-0.5">Verified Customer</p>
                      </div>
                      {/* Verified badge */}
                      <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/8 border border-emerald-500/15 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Verified</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Next */}
            <button
              onClick={() => navigate(1)}
              className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border border-white/8 bg-white/3 hover:border-gold/35 hover:bg-gold/8 hover:text-gold text-zinc-500 items-center justify-center transition-all duration-300 group"
            >
              <ChevronRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile navigation */}
          <div className="flex md:hidden items-center justify-center gap-3 mt-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full border border-white/8 text-zinc-500 hover:text-gold hover:border-gold/30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-gold shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-600'}`}
              />
            ))}
            <button onClick={() => navigate(1)} className="p-2 rounded-full border border-white/8 text-zinc-500 hover:text-gold hover:border-gold/30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop dots */}
          <div className="hidden md:flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`rounded-full transition-all duration-400 ${i === current ? 'w-7 h-2 bg-gradient-to-r from-gold to-amber-500 shadow-[0_0_8px_rgba(212,175,55,0.35)]' : 'w-2 h-2 bg-zinc-800 hover:bg-zinc-700'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
