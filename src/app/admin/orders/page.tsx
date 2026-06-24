'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Search, ChefHat, Package, CheckCircle, Clock,
  X, Printer, Download, Phone, MapPin, ChevronRight, ShoppingBag,
  Copy, MessageCircle, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStoredOrders, saveOrders } from '@/lib/seed-data';

/* ── Types ── */
interface OrderItem {
  name: string;
  qty: number;
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  amount: number;
  pickupTime: string;
  status: 'received' | 'preparing' | 'ready' | 'completed';
  notes?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  received: { label: 'Received', pill: 'bg-blue-500/8 text-blue-400 border border-blue-500/15', dot: 'bg-blue-400' },
  preparing: { label: 'Preparing', pill: 'bg-amber-500/8 text-amber-400 border border-amber-500/15', dot: 'bg-amber-400' },
  ready: { label: 'Ready ✓', pill: 'bg-emerald-500/8 text-emerald-400 border border-emerald-500/15', dot: 'bg-emerald-400' },
  completed: { label: 'Completed', pill: 'bg-zinc-800/30 text-zinc-500 border border-white/5', dot: 'bg-zinc-600' },
};

const statusFlow = ['received', 'preparing', 'ready', 'completed'] as const;

const initialOrders: Order[] = [
  { id: 'CRV-048', customer: 'Rahul Kumar', phone: '+91 98765 43210', items: [{ name: 'Chicken Shawarma', qty: 2 }, { name: 'French Fries', qty: 1 }], amount: 480, pickupTime: '18:30', status: 'preparing', notes: 'Extra garlic sauce please', createdAt: '5:12 PM' },
  { id: 'CRV-047', customer: 'Priya Sharma', phone: '+91 87654 32109', items: [{ name: 'Beef Burger', qty: 1 }, { name: 'Lemon Mint', qty: 1 }], amount: 330, pickupTime: '18:15', status: 'ready', createdAt: '5:05 PM' },
  { id: 'CRV-046', customer: 'Amit Patel', phone: '+91 76543 21098', items: [{ name: 'Chicken Combo', qty: 1 }, { name: 'Brownie Sundae', qty: 1 }], amount: 550, pickupTime: '18:00', status: 'completed', createdAt: '4:50 PM' },
  { id: 'CRV-045', customer: 'Divya Rajan', phone: '+91 65432 10987', items: [{ name: 'Chicken Shawarma', qty: 1 }], amount: 180, pickupTime: '18:45', status: 'received', createdAt: '5:30 PM' },
  { id: 'CRV-044', customer: 'Vikram Singh', phone: '+91 54321 09876', items: [{ name: 'Veg Shawarma', qty: 2 }, { name: 'French Fries', qty: 1 }], amount: 530, pickupTime: '19:00', status: 'received', createdAt: '5:35 PM' },
  { id: 'CRV-043', customer: 'Ananya Patel', phone: '+91 43210 98765', items: [{ name: 'Chicken Burger', qty: 2 }], amount: 400, pickupTime: '19:15', status: 'preparing', notes: 'No onions', createdAt: '5:40 PM' },
  { id: 'CRV-042', customer: 'Sneha Kapoor', phone: '+91 32109 87654', items: [{ name: 'Chocolate Milkshake', qty: 2 }, { name: 'French Fries', qty: 1 }], amount: 400, pickupTime: '18:20', status: 'ready', createdAt: '5:10 PM' },
  { id: 'CRV-041', customer: 'Arun Kumar', phone: '+91 21098 76543', items: [{ name: 'Chicken Shawarma', qty: 1 }, { name: 'Lemon Mint', qty: 1 }], amount: 260, pickupTime: '18:50', status: 'received', createdAt: '5:32 PM' },
];

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => getStoredOrders() ?? initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [copied, setCopied] = useState('');

  const updateStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      saveOrders(updated);
      return updated;
    });
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopied(phone);
    setTimeout(() => setCopied(''), 2000);
  };

  const queuePosition = (orderId: string) => {
    const active = orders.filter(o => o.status !== 'completed');
    const idx = active.findIndex(o => o.id === orderId);
    return idx >= 0 ? idx + 1 : '-';
  };

  const pickupCountdown = (pickupTime: string) => {
    const [h, m] = pickupTime.split(':').map(Number);
    const pickup = h * 60 + m;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const diff = pickup - current;
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Now';
    return `${diff} min`;
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    const header = 'Order ID,Customer,Items,Amount,Pickup Time,Status\n';
    const rows = orders.map(o =>
      `${o.id},"${o.customer}","${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}",₹${o.amount},${o.pickupTime},${o.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const printOrder = (order: Order) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const itemTotal = order.items.reduce((s, it) => s + it.qty, 0);
    w.document.write(`
      <html><head><title>Receipt ${order.id}</title>
      <style>
        @page { width: 80mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace; font-size: 11px;
          color: #111; width: 80mm; padding: 8mm 4mm;
          line-height: 1.5;
        }
        h1 { font-size: 18px; text-align: center; letter-spacing: 2px; margin-bottom: 2px; }
        .sub { text-align: center; font-size: 9px; color: #666; margin-bottom: 4px; }
        .divider { border: none; border-top: 1px dashed #999; margin: 8px 0; }
        .divider-solid { border: none; border-top: 1px solid #333; margin: 8px 0; }
        .badge { display: block; text-align: center; font-size: 14px; font-weight: bold; letter-spacing: 1px; margin: 4px 0; }
        .info { font-size: 10px; margin: 4px 0; }
        .info strong { display: inline-block; width: 55px; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
        th { text-align: left; font-size: 9px; text-transform: uppercase; color: #666; padding: 3px 0; border-bottom: 1px solid #ddd; }
        td { padding: 3px 0; font-size: 11px; }
        td:last-child, th:last-child { text-align: right; }
        td:nth-child(2), th:nth-child(2) { text-align: center; }
        .total-row td { font-weight: bold; font-size: 13px; padding-top: 6px; border-top: 2px solid #333; }
        .notes { font-size: 10px; color: #555; margin: 4px 0; padding: 4px 0; border-top: 1px dashed #ddd; }
        .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #888; border-top: 1px dashed #ccc; padding-top: 8px; }
        .footer b { color: #333; }
        .cut-line { text-align: center; font-size: 14px; color: #ccc; letter-spacing: 4px; margin: 8px 0; }
        @media print {
          body { width: auto; padding: 0; }
          .no-print { display: none; }
        }
      </style></head>
      <body>
        <h1>CRAVE</h1>
        <p class="sub">LIC Metro, Chennai</p>
        <p class="sub">${new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        <hr class="divider" />
        <span class="badge">${order.id}</span>
        <hr class="divider" />
        <p class="info"><strong>Customer</strong> ${order.customer}</p>
        <p class="info"><strong>Phone</strong> ${order.phone}</p>
        <p class="info"><strong>Pickup</strong> ${order.pickupTime}</p>
        <hr class="divider" />
        <table>
          <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
          ${order.items.map(i => {
            const price = Math.round(order.amount / itemTotal * i.qty);
            return `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${price}</td></tr>`;
          }).join('')}
          <tr class="total-row"><td colspan="2">TOTAL</td><td>₹${order.amount}</td></tr>
        </table>
        <hr class="divider-solid" />
        <p class="info"><strong>Status</strong> ${order.status.toUpperCase()}</p>
        ${order.notes ? `<p class="notes">📝 ${order.notes}</p>` : ''}
        <p class="cut-line">- - - - - - - -</p>
        <div class="footer">
          Thank you!<br />
          <b>Visit again</b>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body></html>
    `);
    w.document.close();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#06060A] flex items-center justify-center">
        <p className="text-zinc-500 font-black">Access Denied</p>
      </div>
    );
  }

  const filterTabs = ['all', 'received', 'preparing', 'ready', 'completed'];
  const counts = { all: orders.length } as Record<string, number>;
  filterTabs.forEach(t => { counts[t] = t === 'all' ? orders.length : orders.filter(o => o.status === t).length; });

  return (
    <div className="min-h-screen bg-[#06060A] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* Header */}
      <div className="bg-[rgba(8,8,14,0.6)] backdrop-blur-xl border-b border-white/[0.05] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/dashboard" className="p-2 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 hover:border-gold/22 text-zinc-400 hover:text-gold transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Order Management</h1>
              <p className="text-zinc-500 text-sm mt-0.5">{orders.length} total orders · {orders.filter(o => o.status !== 'completed').length} active</p>
            </div>
            <button onClick={exportCSV} className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-white/8 bg-white/3 hover:border-gold/22 hover:bg-gold/5 text-zinc-400 hover:text-gold rounded-xl transition-all text-[11px] font-black uppercase tracking-widest">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by order ID or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 input-dark rounded-xl text-sm font-medium"
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {filterTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    statusFilter === tab
                      ? 'bg-gold/10 text-gold border-gold/22'
                      : 'bg-white/3 text-zinc-600 border-white/5 hover:text-zinc-300 hover:border-white/10'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    statusFilter === tab ? 'bg-gold/20 text-gold' : 'bg-white/5 text-zinc-600'
                  }`}>
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders list */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 relative z-10">
        <div className="grid gap-4">
          {filtered.map((order, i) => {
            const sc = statusConfig[order.status];
            const statusIdx = statusFlow.indexOf(order.status);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedOrder(order)}
                className="group bg-[rgba(10,9,18,0.65)] backdrop-blur-lg border border-white/[0.06] hover:border-gold/18 rounded-[20px] p-5 transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Order ID + Status Timeline */}
                  <div className="flex items-center gap-4 sm:w-52 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      <span className="font-black text-sm text-white">{order.id}</span>
                    </div>
                    {/* Mini status dots */}
                    <div className="hidden sm:flex items-center gap-0.5 ml-auto">
                      {statusFlow.map((s, si) => (
                        <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all ${
                          si <= statusIdx ? 'bg-gold' : 'bg-zinc-800'
                        } ${si === statusIdx ? 'ring-1 ring-gold/30' : ''}`} />
                      ))}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors truncate">{order.customer}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-semibold mt-0.5">
                      <Phone className="w-3 h-3" />{order.phone}
                      <button
                        onClick={(e) => { e.stopPropagation(); copyPhone(order.phone); }}
                        className="p-0.5 hover:text-gold transition-colors"
                        title="Copy phone"
                      >
                        {copied === order.phone ? <span className="text-emerald-400 text-[9px]">Copied!</span> : <Copy className="w-3 h-3" />}
                      </button>
                      <a href={`tel:${order.phone}`} onClick={(e) => e.stopPropagation()} className="p-0.5 hover:text-gold transition-colors" title="Call">
                        <Phone className="w-3 h-3" />
                      </a>
                      <a href={`https://wa.me/${order.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="p-0.5 hover:text-gold transition-colors" title="WhatsApp">
                        <MessageCircle className="w-3 h-3" />
                      </a>
                      <span className="text-zinc-800">·</span>
                      <MapPin className="w-3 h-3" />Pickup {order.pickupTime}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="hidden md:block flex-1 max-w-[200px]">
                    <p className="text-xs text-zinc-500 leading-tight line-clamp-1">
                      {order.items.map((item, idx) => (
                        <span key={idx}>
                          <span className="text-gold font-black">{item.qty}×</span> {item.name}{idx < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* Amount + Queue + Pickup */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-black text-sm text-zinc-200">₹{order.amount}</p>
                      <p className="text-[10px] text-zinc-600 font-bold">{order.createdAt}</p>
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="font-black text-xs text-gold">#{queuePosition(order.id)}</p>
                      <p className="text-[9px] text-zinc-600 font-bold">Queue</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-xs ${pickupCountdown(order.pickupTime) === 'Overdue' ? 'text-rose-400' : pickupCountdown(order.pickupTime) === 'Now' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {pickupCountdown(order.pickupTime)}
                      </p>
                      <p className="text-[9px] text-zinc-600 font-bold">{order.pickupTime}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border whitespace-nowrap ${sc.pill}`}>
                      <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-gold/50 transition-colors hidden sm:block" />
                  </div>
                </div>

                {/* Action buttons row (visible on hover) */}
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {order.status === 'received' && (
                    <ActionBtn onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'preparing'); }} icon={ChefHat} label="Start Preparing" color="text-amber-400" border="border-amber-500/12 hover:border-amber-500/30" bg="bg-amber-500/5 hover:bg-amber-500/12" />
                  )}
                  {order.status === 'preparing' && (
                    <ActionBtn onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'ready'); }} icon={CheckCircle} label="Mark Ready" color="text-emerald-400" border="border-emerald-500/12 hover:border-emerald-500/30" bg="bg-emerald-500/5 hover:bg-emerald-500/12" />
                  )}
                  {order.status === 'ready' && (
                    <ActionBtn onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completed'); }} icon={Package} label="Mark Collected" color="text-blue-400" border="border-blue-500/12 hover:border-blue-500/30" bg="bg-blue-500/5 hover:bg-blue-500/12" />
                  )}
                  <ActionBtn onClick={(e) => { e.stopPropagation(); printOrder(order); }} icon={Printer} label="Print" color="text-zinc-400" border="border-white/8 hover:border-white/18" bg="bg-white/4 hover:bg-white/8" />
                  <a
                    href={`https://wa.me/${order.phone.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all text-emerald-400 border-emerald-500/12 hover:border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/12"
                  >
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <ShoppingBag className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 font-black text-sm uppercase tracking-wider">No orders match your filters</p>
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[rgba(15,14,24,0.95)] backdrop-blur-2xl border border-white/[0.08] rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.8)] z-10"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-[rgba(15,14,24,0.98)] border-b border-white/[0.06] px-8 py-5 flex items-center justify-between rounded-t-[28px] z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[selectedOrder.status].dot}`} />
                  <h2 className="text-lg font-black text-white">{selectedOrder.id}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusConfig[selectedOrder.status].pill}`}>
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl border border-white/8 hover:border-white/18 text-zinc-500 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Status progression */}
                <div>
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Order Progress</h3>
                  <div className="flex items-center gap-1">
                    {statusFlow.map((s, i) => {
                      const currentIdx = statusFlow.indexOf(selectedOrder.status);
                      const done = i <= currentIdx;
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            done ? 'bg-gold/10 text-gold border border-gold/15' : 'bg-zinc-900/50 text-zinc-700 border border-white/5'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-gold' : 'bg-zinc-700'}`} />
                            {statusConfig[s].label}
                          </div>
                          {i < statusFlow.length - 1 && (
                            <div className={`flex-1 h-px mx-2 ${done && i < currentIdx ? 'bg-gold/30' : 'bg-zinc-800'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Customer</h3>
                    <p className="text-sm font-bold text-white">{selectedOrder.customer}</p>
                    <p className="text-xs text-zinc-500 font-semibold mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gold/50" />
                      {selectedOrder.phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Pickup Details</h3>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gold/60" />
                      {selectedOrder.pickupTime}
                    </p>
                    <p className="text-xs text-zinc-600 font-semibold mt-0.5">{selectedOrder.createdAt}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Order Items</h3>
                  <div className="divide-y divide-white/[0.04] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {selectedOrder.items.map((item, i) => {
                      const itemTotal = Math.round(selectedOrder.amount / selectedOrder.items.reduce((s, it) => s + it.qty, 0) * item.qty);
                      return (
                        <div key={i} className="flex items-center justify-between px-5 py-3.5 bg-black/20">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-gold bg-gold/10 px-2 py-0.5 rounded-md">{item.qty}×</span>
                            <span className="text-sm font-semibold text-zinc-200">{item.name}</span>
                          </div>
                          <span className="text-sm font-black text-zinc-300">₹{itemTotal}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-5 py-4 bg-gold/[0.03] border-t border-gold/10">
                      <span className="text-sm font-black text-white">Total</span>
                      <span className="text-lg font-black text-gradient-gold">₹{selectedOrder.amount}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Notes</h3>
                    <p className="text-sm text-zinc-400 bg-black/30 border border-white/5 rounded-xl px-4 py-3">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {selectedOrder.status === 'received' && (
                    <ModalBtn onClick={() => updateStatus(selectedOrder.id, 'preparing')} icon={ChefHat} label="Start Preparing" color="from-amber-400 to-orange-500" />
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <ModalBtn onClick={() => updateStatus(selectedOrder.id, 'ready')} icon={CheckCircle} label="Mark Ready for Pickup" color="from-emerald-400 to-green-500" />
                  )}
                  {selectedOrder.status === 'ready' && (
                    <ModalBtn onClick={() => updateStatus(selectedOrder.id, 'completed')} icon={Package} label="Mark as Collected" color="from-blue-400 to-violet-500" />
                  )}
                  <button onClick={() => printOrder(selectedOrder)} className="flex items-center gap-2 px-5 py-3 border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/6 text-zinc-300 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest">
                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                  <a href={`tel:${selectedOrder.phone}`} className="flex items-center gap-2 px-5 py-3 border border-white/10 hover:border-gold/22 bg-white/3 hover:bg-gold/5 text-zinc-300 hover:text-gold rounded-xl transition-all text-[11px] font-black uppercase tracking-widest">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`https://wa.me/${selectedOrder.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="flex items-center gap-2 px-5 py-3 border border-emerald-500/10 hover:border-emerald-500/22 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helpers ── */
function ActionBtn({ onClick, icon: Icon, label, color, border, bg }: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: string;
  border: string;
  bg: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${color} ${border} ${bg}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function ModalBtn({ onClick, icon: Icon, label, color }: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${color} text-white font-black uppercase tracking-widest text-[11px] rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
