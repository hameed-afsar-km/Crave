'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Phone, Clock, Mail, MessageSquare, Send, ArrowRight } from 'lucide-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/cart', label: 'Cart' },
  { href: '/profile', label: 'Profile' },
];

const contact = [
  { icon: MapPin, text: 'Near LIC Metro, Chennai' },
  { icon: Phone, text: '+91 98765 43210' },
  { icon: Mail, text: 'hello@craveexpress.in' },
];

const hours = [
  { day: 'Mon – Sat', time: '10:00 AM – 10:00 PM' },
  { day: 'Sunday', time: '11:00 AM – 9:00 PM' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Top gold divider */}
      <div className="divider-gold" />

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07070F] to-[#06060A]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(212,175,55,0.03)_0%,transparent_65%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 space-y-5"
          >
            <div>
              <h2 className="text-3xl font-black text-gradient-gold tracking-widest glow-text-sm mb-1">
                CRAVE
              </h2>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                Skip the Queue • Order Smarter
              </p>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-[240px]">
              Freshly prepared local favorites near LIC Metro, Chennai. Hot, fresh, and ready when you arrive.
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5">
              {[MessageSquare, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl border border-white/8 bg-white/3 flex items-center justify-center text-zinc-500 hover:text-gold hover:border-gold/28 hover:bg-gold/5 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="space-y-4"
          >
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 pb-2 border-b border-white/4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-gold transition-colors duration-200 font-medium"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
            className="space-y-4"
          >
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 pb-2 border-b border-white/4">
              Contact
            </h4>
            <ul className="space-y-3.5">
              {contact.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-zinc-500 text-sm group">
                  <Icon className="w-4 h-4 text-gold/60 shrink-0 mt-0.5 group-hover:text-gold transition-colors" />
                  <span className="leading-tight">{text}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Hours */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24 }}
            className="space-y-4"
          >
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 pb-2 border-b border-white/4">
              Hours
            </h4>
            <ul className="space-y-3.5">
              {hours.map(({ day, time }) => (
                <li key={day} className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gold/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-zinc-300 font-semibold leading-tight">{day}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{time}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA mini */}
            <div className="mt-6 pt-5 border-t border-white/4">
              <Link
                href="/menu"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold/12 to-amber-500/8 border border-gold/18 text-gold text-xs font-bold rounded-full hover:from-gold/20 hover:to-amber-500/15 hover:border-gold/30 transition-all duration-300"
              >
                Order Now
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-white/[0.05] pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-700 text-[11px] font-semibold tracking-wider"
        >
          <p>© {new Date().getFullYear()} Crave Express. All rights reserved.</p>
          <p className="text-zinc-800">Built with ♥ in Chennai</p>
        </motion.div>
      </div>
    </footer>
  );
}
