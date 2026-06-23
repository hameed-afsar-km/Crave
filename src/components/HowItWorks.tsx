'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Clock, Package, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: ShoppingBag,
    title: 'Browse & Add',
    description: 'Explore our menu and add your favorites to cart in seconds.',
    number: '01',
  },
  {
    icon: Clock,
    title: 'Pick Your Time',
    description: 'Select a convenient pickup slot that fits your schedule.',
    number: '02',
  },
  {
    icon: Package,
    title: 'We Prepare',
    description: 'Our kitchen gets your order ready exactly on time.',
    number: '03',
  },
  {
    icon: CheckCircle,
    title: 'Collect & Enjoy',
    description: 'Walk in, grab your fresh food, skip the queue entirely.',
    number: '04',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#070710]" />
      {/* Subtle diagonal grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060A] via-transparent to-[#06060A] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/8 text-gold text-[10px] font-bold rounded-full border border-gold/18 uppercase tracking-widest mb-5">
            <span className="w-1 h-1 rounded-full bg-gold" />
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Four Simple Steps
          </h2>
          <p className="text-zinc-500 text-base mt-4 max-w-md mx-auto">
            From craving to collecting — it takes under 2 minutes to place your order.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Desktop connector line */}
          <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-[1px]">
            <div className="h-full bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
            {/* Glowing dot at each step */}
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]"
                style={{ left: `${i * 33.33}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.12, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col items-center text-center relative"
              >
                {/* Step circle */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="relative w-[104px] h-[104px] mb-6"
                >
                  {/* Outer glow ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md" />
                  {/* Circle */}
                  <div className="absolute inset-0 rounded-full border border-gold/20 group-hover:border-gold/50 bg-[#0a0a14] transition-all duration-400 flex items-center justify-center shadow-2xl">
                    <step.icon className="w-9 h-9 text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center border-2 border-[#070710] shadow-lg">
                    <span className="text-[10px] font-black text-white">{i + 1}</span>
                  </div>
                  {/* Large number behind */}
                  <span className="absolute -bottom-2 -left-2 text-6xl font-black text-gold/[0.04] select-none pointer-events-none leading-none">
                    {step.number}
                  </span>
                </motion.div>

                <h3 className="text-lg font-black text-white mb-2.5 group-hover:text-gold transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-[180px]">
                  {step.description}
                </p>

                {/* Mobile step connector (vertical) */}
                {i < steps.length - 1 && (
                  <div className="sm:hidden mt-6 w-[1px] h-8 bg-gradient-to-b from-gold/25 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
