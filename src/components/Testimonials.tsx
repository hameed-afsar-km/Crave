'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { testimonials } from '@/lib/data';

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navigate = (dir: number) => {
    setDirection(dir);
    setCurrent(prev => {
      if (dir === 1) return (prev + 1) % testimonials.length;
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  };

  const t = testimonials[current];

  return (
    <section className="py-20 bg-black overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 text-sm font-medium rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            What Our Customers Say
          </h2>
        </motion.div>

        <div className="relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="hidden md:flex w-12 h-12 rounded-full border border-gray-200 items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -100 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 md:p-12 text-center border border-gray-800"
                >
                  <Quote className="w-10 h-10 text-orange-400/50 mx-auto mb-6" />
                  <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6 italic">
                    &ldquo;{t.review}&rdquo;
                  </p>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="font-semibold text-white">{t.name}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={() => navigate(1)}
              className="hidden md:flex w-12 h-12 rounded-full border border-gray-200 items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-orange-500 w-8' : 'bg-gray-700'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
