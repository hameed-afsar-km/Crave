'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Phone, Clock, Mail, ArrowRight, Globe, MessageCircle, Send } from 'lucide-react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/cart', label: 'Cart' },
  { href: '/profile', label: 'Profile' },
];

const contact = [
  { icon: MapPin, text: 'Near LIC Metro, Chennai', href: 'https://google.com/maps?vet=10CAAQoqAOahcKEwjo7a_8rZ-VAxUAAAAAHQAAAAAQBg..i&pvq=Cg0vZy8xMXczM33ZrbnZ2IhMKDWNyYXZlIGNoZW5uYWkQAhgD&lqi=Cg1jcmF2ZSBjaGVubmFpSNqmo72Mu4CACFodEAAQARgAGAEiDWNyYXZlIGNoZW5uYWkqBAgCEACSARNhbWVyaWNhbl9yZXN0YXVyYW50&fvr=1&cs=1&um=1&ie=UTF-8&fb=1&gl=in&sa=X&ftid=0x3a5267002704c237:0xe2a90d500edeccc3' },
  { icon: Phone, text: '+91 98765 43210' },
  { icon: Mail, text: 'hello@craveexpress.in' },
];

const hours = [
  { day: 'Mon – Sat', time: '10:00 AM – 10:00 PM' },
  { day: 'Sunday', time: '11:00 AM – 9:00 PM' },
];

const socials = [
  { icon: Globe, href: '#' },
  { icon: MessageCircle, href: '#' },
  { icon: Send, href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#07070F] to-[#06060A]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Top bar with brand */}
        <div className="flex items-center gap-3 sm:gap-6 py-6 sm:py-8">
          <div className="divider-gold flex-1" />
          <h2 className="font-steelfish text-3xl sm:text-5xl md:text-7xl text-white shrink-0">
            Crave
          </h2>
          <div className="divider-gold flex-1" />
        </div>

        {/* Info columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-px mb-6 sm:mb-8">
          <div className="bg-[#06060A] rounded-lg sm:rounded-none p-4 sm:p-5 md:p-6 space-y-3">
            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">About</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Freshly prepared local favorites near LIC Metro, Chennai. Hot, fresh, and ready when you arrive.
            </p>
            <div className="flex gap-2.5 pt-1">
              {socials.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-full border border-white/8 flex items-center justify-center text-zinc-500 hover:text-gold hover:border-gold/30 transition-all duration-300"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="bg-[#06060A] rounded-lg sm:rounded-none p-4 sm:p-5 md:p-6 space-y-3">
            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">Links</h4>
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#06060A] rounded-lg sm:rounded-none p-4 sm:p-5 md:p-6 space-y-3">
            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">Contact</h4>
            <ul className="space-y-2.5">
              {contact.map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-start gap-2.5 text-zinc-500 text-sm">
                  <Icon className="w-3.5 h-3.5 text-gold/60 shrink-0 mt-0.5" />
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="leading-tight hover:text-white transition-colors duration-200">
                      {text}
                    </a>
                  ) : (
                    <span className="leading-tight">{text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#06060A] rounded-lg sm:rounded-none p-4 sm:p-5 md:p-6 space-y-3">
            <h4 className="text-[10px] font-bold text-gold uppercase tracking-widest">Hours</h4>
            <ul className="space-y-2.5">
              {hours.map(({ day, time }) => (
                <li key={day} className="flex items-start gap-2.5 text-sm">
                  <Clock className="w-3.5 h-3.5 text-gold/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-zinc-300 font-medium leading-tight">{day}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{time}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 text-xs text-gold font-bold hover:text-gold-light transition-colors"
              >
                Order Now
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-white/[0.04] py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-700 text-[11px] font-semibold text-center sm:text-left"
        >
          <p>© {new Date().getFullYear()} Crave Express. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-500 transition-colors">Terms</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
