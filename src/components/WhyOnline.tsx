'use client';

import { motion } from 'framer-motion';
import { SkipForward, Clock, Zap } from 'lucide-react';

const cards = [
  {
    icon: SkipForward,
    title: 'Skip Long Queues',
    description: 'No more waiting in line. Order online and walk past the queue straight to pickup.',
    color: 'from-gold to-amber-600',
  },
  {
    icon: Clock,
    title: 'Schedule Pickup',
    description: 'Choose your preferred pickup time. Your food will be ready exactly when you arrive.',
    color: 'from-amber-600 to-gold',
  },
  {
    icon: Zap,
    title: 'Get Food Faster',
    description: 'Our efficient system ensures your order is prepared and ready before you reach us.',
    color: 'from-gold to-amber-600',
  },
];

export default function WhyOnline() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-gold/10 text-gold text-sm font-medium rounded-full mb-4">
            Why Order Online
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Order Smart, Eat Fresh
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -10 }}
              className="group relative p-8 rounded-3xl bg-gradient-to-br from-gray-950 to-black border border-gray-800 hover:border-gold/30 transition-all duration-500"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} p-3 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                <card.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-gray-400 leading-relaxed">{card.description}</p>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/0 to-amber-600/0 group-hover:from-gold/10 group-hover:to-amber-600/10 transition-all duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
