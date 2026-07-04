'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, ChefHat, Package, MapPin, ArrowLeft, Flame, Receipt, X, Printer, ImageIcon, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { escapeHtml } from '@/lib/sanitize';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { subscribeOrder } from '@/lib/firestore-service';

const statusSteps = ['received', 'preparing', 'ready', 'completed'];

const statusConfig: Record<string, { icon: React.ReactNode; label: string; sub: string }> = {
  received: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'Order Received',
    sub: 'We got your order and will start preparing soon.',
  },
  preparing: {
    icon: <ChefHat className="w-5 h-5" />,
    label: 'Being Prepared',
    sub: 'Your food is being freshly prepared right now.',
  },
  ready: {
    icon: <Package className="w-5 h-5" />,
    label: 'Ready for Pickup',
    sub: 'Your order is packed and waiting at the counter!',
  },
  completed: {
    icon: <MapPin className="w-5 h-5" />,
    label: 'Collected',
    sub: 'Enjoy your meal! Hope to see you again soon.',
  },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const { user } = useAuth();
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const downloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#0f0e18', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `receipt-${order.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch {}
  };

  const downloadPdf = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#0f0e18', pixelRatio: 2 });
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const pdf = new jsPDF({ unit: 'mm', format: [80, 150], compress: true });
      const imgW = 72;
      const imgH = (img.naturalHeight / img.naturalWidth) * imgW;
      pdf.addImage(dataUrl, 'PNG', 4, 10, imgW, imgH);
      pdf.save(`receipt-${order.id}.pdf`);
    } catch {}
  };

  useEffect(() => {
    if (!params.id || !user) return;
    const orderId = params.id as string;
    const unsub = subscribeOrder(orderId, (order) => {
      if (order) {
        setOrderInfo(order);
      }
    });
    return unsub;
  }, [params.id, user]);

  const order = orderInfo || {
    id: params.id,
    status: 'received',
    items: [],
    amount: 0,
    pickupTime: '--:--',
    estimatedWaitTime: 18,
    customerName: 'Customer',
  };

  const currentStepIndex = statusSteps.indexOf(order.status || 'received');

  const printReceipt = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const e = escapeHtml;
    const itemRows = order.items.map((item: any) =>
      `<tr><td>${e(item.name || item.menuItemId)}</td><td>${item.qty || item.quantity}</td><td>₹${(item.price || 0) * (item.qty || item.quantity || 0)}</td></tr>`
    ).join('');
    w.document.write(`
      <html><head><title>Receipt ${e(order.id)}</title>
      <style>
        @page { width: 80mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 11px; color: #111; width: 80mm; padding: 8mm 4mm; line-height: 1.5; }
        h1 { font-size: 18px; text-align: center; letter-spacing: 2px; margin-bottom: 2px; }
        .sub { text-align: center; font-size: 9px; color: #666; margin-bottom: 4px; }
        .divider { border: none; border-top: 1px dashed #999; margin: 8px 0; }
        .divider-solid { border: none; border-top: 1px solid #333; margin: 8px 0; }
        .badge { display: block; text-align: center; font-size: 10px; font-weight: bold; letter-spacing: 1px; margin: 4px 0; }
        .info { font-size: 10px; margin: 4px 0; }
        .info strong { display: inline-block; width: 55px; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
        th { text-align: left; font-size: 9px; text-transform: uppercase; color: #666; padding: 3px 0; border-bottom: 1px solid #ddd; }
        td { padding: 3px 0; font-size: 11px; }
        td:last-child, th:last-child { text-align: right; }
        td:nth-child(2), th:nth-child(2) { text-align: center; }
        .total-row td { font-weight: bold; font-size: 13px; padding-top: 6px; border-top: 2px solid #333; }
        .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #888; border-top: 1px dashed #ccc; padding-top: 8px; }
        .footer b { color: #333; }
        @media print { body { width: auto; padding: 0; } }
      </style></head>
      <body>
        <h1>CRAVE</h1>
        <p class="sub">LIC Metro, Chennai</p>
        <p class="sub">${new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
        <hr class="divider" />
        <span class="badge">${e(order.id)}</span>
        <hr class="divider" />
        <p class="info"><strong>Customer</strong> ${e(order.customerName || order.customer)}</p>
        <p class="info"><strong>Phone</strong> ${e(order.customerPhone || order.phone)}</p>
        <p class="info"><strong>Pickup</strong> ${e(order.pickupTime)}</p>
        <hr class="divider" />
        <table>
          <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
          ${itemRows}
          <tr class="total-row"><td colspan="2">TOTAL</td><td>₹${order.amount}</td></tr>
        </table>
        <hr class="divider-solid" />
        <div class="footer">Thank you!<br/><b>Visit again</b></div>
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-[#06060A] pt-32 md:pt-40 pb-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[radial-gradient(circle,rgba(212,175,55,0.05)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(212,175,55,0.03)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-gold transition-colors mb-7 text-sm font-semibold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        {/* Main tracking card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[32px] bg-[rgba(12,9,5,0.72)] backdrop-blur-xl border border-gold/15 p-7 md:p-10 mb-5 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(212,175,55,0.07)_0%,transparent_65%)] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="w-4 h-4 text-gold" />
                <h1 className="text-xl font-black text-white tracking-tight">Order Status</h1>
              </div>
              <p className="text-zinc-600 text-xs font-bold tracking-wider">#{order.id}</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/8 rounded-full border border-emerald-500/15"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </div>
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Live</span>
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="relative pl-3">
            <div className="absolute left-[31px] top-3 bottom-3 w-px bg-gradient-to-b from-gold/20 via-gold/10 to-transparent" />

            <div className="space-y-7">
              {statusSteps.map((step, i) => {
                const isDone = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const cfg = statusConfig[step];

                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-5"
                  >
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-500 ${
                        isDone
                          ? 'bg-gradient-to-br from-gold to-amber-600 border-transparent text-white shadow-lg shadow-gold/20'
                          : 'bg-[#0a0908] border-white/8 text-zinc-700'
                      }`}
                    >
                      {cfg.icon}
                      {isCurrent && (
                        <span className="absolute -inset-1 rounded-full border border-gold/30 animate-pulse" />
                      )}
                    </motion.div>

                    <div className="flex-1 pt-1.5">
                      <div className="flex items-center gap-2.5">
                        <h3 className={`font-black text-sm tracking-wide transition-colors ${isDone ? 'text-white' : 'text-zinc-600'}`}>
                          {cfg.label}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-gold/10 text-gold text-[9px] font-black rounded-full border border-gold/15 uppercase tracking-widest animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 font-medium transition-colors ${isDone ? 'text-zinc-500' : 'text-zinc-700'}`}>
                        {cfg.sub}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* View Receipt Button */}
          <div className="mt-8 pt-6 border-t border-white/8">
            <button
              onClick={() => setShowReceipt(true)}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-white/5 hover:bg-gold/10 border border-white/10 hover:border-gold/25 text-zinc-300 hover:text-gold rounded-2xl transition-all text-sm font-bold"
            >
              <Receipt className="w-4 h-4" />
              View Bill Receipt
            </button>
          </div>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Clock, label: 'Est. Wait', value: `${order.estimatedWaitTime || 18} min` },
            { icon: Clock, label: 'Pickup Time', value: order.pickupTime },
            { icon: Package, label: 'Total', value: formatPrice(order.amount), gold: true },
          ].map(({ icon: Icon, label, value, gold }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="rounded-[20px] bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] p-5 text-center"
            >
              <Icon className="w-5 h-5 text-gold mx-auto mb-3" />
              <p className={`text-2xl font-black tracking-tight ${gold ? 'text-gradient-gold glow-text-sm' : 'text-white'}`}>
                {value}
              </p>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 text-center"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-gold transition-colors"
          >
            <Flame className="w-4 h-4" />
            Order something else
          </Link>
        </motion.div>
      </div>

      {/* ── Receipt Modal ── */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowReceipt(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[rgba(15,14,24,0.95)] backdrop-blur-2xl border border-white/[0.08] rounded-[28px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.8)] z-10"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-[rgba(15,14,24,0.98)] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between rounded-t-[28px]">
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-gold" />
                  <h2 className="text-sm font-black text-white">Bill Receipt</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={downloadImage} className="p-2 rounded-xl border border-white/8 hover:border-sky-500/20 text-zinc-500 hover:text-sky-400 hover:bg-sky-500/8 transition-all" title="Download as Image">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button onClick={downloadPdf} className="p-2 rounded-xl border border-white/8 hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/8 transition-all" title="Download as PDF">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={printReceipt} className="p-2 rounded-xl border border-white/8 hover:border-emerald-500/20 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all" title="Print">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowReceipt(false)} className="p-2 rounded-xl border border-white/8 hover:border-white/18 text-zinc-500 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div ref={receiptRef} className="p-6">
                {/* Receipt content */}
                <div className="text-center mb-6 pb-4 border-b border-white/5">
                  <h3 className="text-xl font-black text-gradient-gold tracking-wider">CRAVE</h3>
                  <p className="text-[10px] text-zinc-600 font-semibold mt-0.5">LIC Metro, Chennai</p>
                  <p className="text-[9px] text-zinc-700 font-bold mt-0.5">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="text-center mb-5">
                  <p className="text-xs font-black text-gold bg-gold/10 px-3 py-1.5 rounded-lg inline-block border border-gold/15">
                    {order.id}
                  </p>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400 mb-5 pb-4 border-b border-white/5">
                  <p><span className="font-bold text-zinc-500 inline-block w-16">Customer</span> {order.customerName || order.customer}</p>
                  <p><span className="font-bold text-zinc-500 inline-block w-16">Phone</span> {order.customerPhone || order.phone}</p>
                  <p><span className="font-bold text-zinc-500 inline-block w-16">Pickup</span> {order.pickupTime}</p>
                  <p><span className="font-bold text-zinc-500 inline-block w-16">Status</span> <span className="text-gold font-bold uppercase">{order.status}</span></p>
                </div>

                {/* Items */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 pb-2 border-b border-white/5">
                    <span>Item</span>
                    <div className="flex gap-6">
                      <span>Qty</span>
                      <span className="w-14 text-right">Amount</span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300">{item.name || item.menuItemId}</span>
                        <div className="flex gap-6">
                          <span className="font-black text-zinc-400 w-6 text-center">{item.qty || item.quantity}</span>
                          <span className="font-black text-zinc-200 w-14 text-right">₹{(item.price || 0) * (item.qty || item.quantity || 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gold/20 bg-gold/[0.03] -mx-6 px-6 py-4">
                  <span className="font-black text-white text-sm">Total</span>
                  <span className="text-xl font-black text-gradient-gold">₹{order.amount}</span>
                </div>

                <p className="text-center text-[10px] text-zinc-700 font-semibold mt-5 tracking-wide">
                  Thank you! · Visit again
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
