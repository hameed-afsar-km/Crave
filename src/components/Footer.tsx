'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPin, Phone, Clock, Mail, Globe, MessageCircle, AtSign } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold bg-gradient-to-r from-gold to-amber-600 bg-clip-text text-transparent mb-4">
              CRAVE
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Skip the queue. Order smarter. Your favorite food, ready when you are.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <div className="flex flex-col gap-3">
              <Link href="/" className="text-gray-400 hover:text-gold transition-colors text-sm">Home</Link>
              <Link href="/menu" className="text-gray-400 hover:text-gold transition-colors text-sm">Menu</Link>
              <Link href="/cart" className="text-gray-400 hover:text-gold transition-colors text-sm">Cart</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 text-gold shrink-0" />
                <span>Near LIC Metro, Chennai</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <span>hello@craveexpress.in</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-semibold text-lg mb-4">Working Hours</h4>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Clock className="w-4 h-4 text-gold shrink-0" />
                <span>Mon - Sat: 10:00 AM - 10:00 PM</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Clock className="w-4 h-4 text-gold shrink-0" />
                <span>Sun: 11:00 AM - 9:00 PM</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <AtSign className="w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-white/10 mt-12 pt-8 text-center text-gray-500 text-sm"
        >
          <p>&copy; {new Date().getFullYear()} Crave Express. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
}
