'use client';

import { motion } from 'framer-motion';
import { SkipForward, Clock, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const cards = [
  {
    icon: SkipForward,
    title: 'Skip Long Queues',
    description: 'No more waiting in line. Order online and walk past the crowd straight to pickup.',
    stat: '0 min',
    statLabel: 'Wait time',
    accent: 'from-gold/15 to-amber-500/5',
    iconBg: 'from-gold to-amber-500',
    glow: 'rgba(212,175,55,0.15)',
  },
  {
    icon: Clock,
    title: 'Schedule Pickup',
    description: 'Choose your preferred pickup window. Your food will be ready exactly when you arrive.',
    stat: '18 min',
    statLabel: 'Avg prep time',
    accent: 'from-amber-500/15 to-gold/5',
    iconBg: 'from-amber-400 to-gold',
    glow: 'rgba(245,216,122,0.15)',
  },
  {
    icon: Zap,
    title: 'Get Food Faster',
    description: 'Our smart kitchen system ensures your order is hot, fresh, and waiting before you arrive.',
    stat: '100%',
    statLabel: 'Fresh guarantee',
    accent: 'from-gold/10 to-amber-600/5',
    iconBg: 'from-gold to-amber-600',
    glow: 'rgba(212,175,55,0.15)',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
};

export default function WhyOnline() {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060A] via-[#08080D] to-[#06060A]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(212,175,55,0.025)_0%,transparent_65%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-18"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/8 text-gold text-[10px] font-bold rounded-full border border-gold/18 uppercase tracking-widest mb-5">
            <span className="w-1 h-1 rounded-full bg-gold" />
            Why Order Online
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Order Smart.{' '}
            <span className="text-gradient-gold">Eat Fresh.</span>
          </h2>
          <p className="text-zinc-500 text-base mt-4 max-w-lg mx-auto leading-relaxed">
            We built Crave to eliminate the worst part of getting great food — the wait.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              variants={cardVariants}
              whileHover={{ y: -10, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
              className="group relative rounded-[28px] overflow-hidden cursor-default"
            >
              {/* Card background & border */}
              <div
                className="absolute inset-0 rounded-[28px] border border-white/6 transition-all duration-500 group-hover:border-gold/25"
                style={{
                  background: 'rgba(10,9,18,0.7)',
                  backdropFilter: 'blur(20px)',
                }}
              />

              {/* Gradient accent overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[28px]`} />

              {/* Glow blob behind card */}
              <div
                className="absolute -inset-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none"
                style={{ background: card.glow }}
              />

              <div className="relative z-10 p-8">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center mb-7 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <card.icon className="w-6.5 h-6.5 text-white" strokeWidth={2.2} />
                </div>

                {/* Text */}
                <h3 className="text-xl font-black text-white mb-3 group-hover:text-gold-light transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                  {card.description}
                </p>

                {/* Mini stat */}
                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                  <span className="text-2xl font-black text-gradient-gold">{card.stat}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">{card.statLabel}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-gold transition-colors group"
          >
            Start your first order
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
