'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Search, ChefHat, Package, CheckCircle, Clock,
  X, Printer, Download, Phone, MapPin, ShoppingBag,
  Copy, MessageCircle, Ban, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminOutlet } from '@/context/AdminOutletContext';
import { subscribeOrders, updateOrderStatus, deleteOrder as deleteOrderFromFirestore } from '@/lib/firestore-service';
import { escapeHtml } from '@/lib/sanitize';

interface OrderItem { name: string; qty: number; }
interface Order {
  id: string; customer: string; phone: string; items: OrderItem[];
  amount: number; pickupTime: string;   status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  notes?: string; cancelReason?: string; createdAt: string;
  outletId?: string; outletName?: string;
}

const statusConfig: Record<string, { label: string; pill: string; dot: string }> = {
  received: { label: 'Received', pill: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', dot: 'bg-blue-500' },
  preparing: { label: 'Preparing', pill: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dot: 'bg-amber-500' },
  ready: { label: 'Ready', pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-500' },
  completed: { label: 'Completed', pill: 'bg-zinc-500/10 text-zinc-500 border border-zinc-700', dot: 'bg-zinc-600' },
  cancelled: { label: 'Cancelled', pill: 'bg-red-500/10 text-red-400 border border-red-500/20', dot: 'bg-red-500' },
};

const statusFlow = ['received', 'preparing', 'ready', 'completed'] as const;

export default function AdminOrders() {
  const { canManageOrders, isMasterAdmin, user } = useAuth();
  const { selectedOutletId, outlets, setSelectedOutletId, isAllOutlets } = useAdminOutlet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState('');
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'delete' | null>(null);
  const [confirmOrderId, setConfirmOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const presetReasons = ['Out of stock', 'Customer request', 'Duplicate order', 'Other'];

  useEffect(() => {
    if (!canManageOrders) return;
    const outletFilter = !isAllOutlets && selectedOutletId ? selectedOutletId : undefined;
    const unsub = subscribeOrders((firestoreOrders) => {
      const mapped = firestoreOrders.map((o: any) => ({
        id: o.id,
        customer: o.customerName || '',
        phone: o.customerPhone || '',
        items: o.items || [],
        amount: o.amount || 0,
        pickupTime: o.pickupTime || '',
        status: o.status || 'received',
        notes: o.notes || o.cancelReason || '',
        cancelReason: o.cancelReason || '',
        createdAt: o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
        outletId: o.outletId || '',
        outletName: o.outletName || '',
      }));
      setOrders(mapped);
    }, [], outletFilter, 100);
    return unsub;
  }, [selectedOutletId, isAllOutlets]);

  const auditUser = { email: user?.email || '', role: user?.role || '', name: user?.name || '' };

  const updateStatus = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus, undefined, auditUser);
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const cancelOrder = (orderId: string, reason: string) => {
    updateOrderStatus(orderId, 'cancelled' as Order['status'], { cancelReason: reason }, auditUser);
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled', cancelReason: reason } : null);
    setConfirmAction(null);
    setConfirmOrderId('');
    setCancelReason('');
  };

  const deleteOrder = async (orderId: string) => {
    await deleteOrderFromFirestore(orderId, { deletedBy: user?.uid || 'unknown', deletedReason: 'Manually deleted by admin', cancelledBy: { email: user?.email || '', role: user?.role || '', name: user?.name || '' } });
    if (selectedOrder?.id === orderId) setSelectedOrder(null);
    setConfirmAction(null);
    setConfirmOrderId('');
  }; 

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone); setCopied(phone); setTimeout(() => setCopied(''), 2000);
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000);
  };

  const toggleItems = (orderId: string) => {
    setExpandedItems(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const queuePosition = (orderId: string) => {
    const active = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const idx = active.findIndex(o => o.id === orderId);
    return idx >= 0 ? idx + 1 : '-';
  };

  const pickupCountdown = (pickupTime: string) => {
    const [h, m] = pickupTime.split(':').map(Number);
    const pickup = h * 60 + m;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const diff = pickup - current;
    if (diff < 0) return 'Overdue'; if (diff === 0) return 'Now'; return `${diff} min`;
  };

  const outletFiltered = isAllOutlets
    ? orders
    : orders.filter(o => o.outletId === selectedOutletId);

  const filtered = outletFiltered.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === 'all' || o.status === statusFilter);
  });

  const exportCSV = () => {
    const header = 'Order ID,Customer,Items,Amount,Pickup Time,Status\n';
    const rows = orders.map(o => `${o.id},"${o.customer}","${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}",₹${o.amount},${o.pickupTime},${o.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const printOrder = (order: Order) => {
    const w = window.open('', '_blank'); if (!w) return;
    const e = escapeHtml;
    const itemTotal = order.items.reduce((s, it) => s + it.qty, 0);
    w.document.write(`
      <html><head><title>Receipt ${e(order.id)}</title>
      <style>
        @page { width: 80mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 11px; color: #111; width: 80mm; padding: 8mm 4mm; line-height: 1.5; }
        h1 { font-size: 18px; text-align: center; letter-spacing: 2px; margin-bottom: 2px; }
        .sub { text-align: center; font-size: 9px; color: #666; margin-bottom: 4px; }
        .divider { border: none; border-top: 1px dashed #999; margin: 8px 0; }
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
        @media print { body { width: auto; padding: 0; } }
      </style></head>
      <body>
        <h1>CRAVE</h1><p class="sub">${e(order.outletName || 'LIC Metro, Chennai')}</p>
        <p class="sub">${new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        <hr class="divider" /><span class="badge">${e(order.id)}</span><hr class="divider" />
        <p class="info"><strong>Customer</strong> ${e(order.customer)}</p><p class="info"><strong>Phone</strong> ${e(order.phone)}</p><p class="info"><strong>Pickup</strong> ${e(order.pickupTime)}</p>
        <hr class="divider" />
        <table><tr><th>Item</th><th>Qty</th><th>Amount</th></tr>${order.items.map(i => { const price = Math.round(order.amount / itemTotal * i.qty); return `<tr><td>${e(i.name)}</td><td>${i.qty}</td><td>₹${price}</td></tr>`; }).join('')}<tr class="total-row"><td colspan="2">TOTAL</td><td>₹${order.amount}</td></tr></table>
        <hr class="divider-solid" /><p class="info"><strong>Status</strong> ${e(order.status.toUpperCase())}</p>${order.notes ? `<p class="notes">📝 ${e(order.notes)}</p>` : ''}
        <p class="cut-line">- - - - - - - -</p><div class="footer">Thank you!<br/><b>Visit again</b></div>
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body></html>
    `); w.document.close();
  };

  if (!canManageOrders) return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500 font-medium">Access Denied</p></div>;

  const filterTabs = ['all', 'received', 'preparing', 'ready', 'completed', 'cancelled'];
  const counts = { all: outletFiltered.length } as Record<string, number>;
  filterTabs.forEach(t => { counts[t] = t === 'all' ? outletFiltered.length : outletFiltered.filter(o => o.status === t).length; });

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="bg-[#0D0D14] border-b border-zinc-800/60">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"><ArrowLeft className="w-4 h-4" /></Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Order Management</h1>
              <p className="text-zinc-500 text-sm mt-0.5">{outletFiltered.length} total · {outletFiltered.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} active</p>
            </div>
            <button onClick={exportCSV} className="hidden sm:flex items-center gap-2 px-3.5 py-2 border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-all text-xs font-medium"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input type="text" placeholder="Search by order ID or customer..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {filterTabs.map(tab => (
                <button key={tab} onClick={() => setStatusFilter(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    statusFilter === tab ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}>
                  {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === tab ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'}`}>{counts[tab]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Outlet selector for Master Admin */}
          {isMasterAdmin && outlets.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5">
              <button
                onClick={() => setSelectedOutletId('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isAllOutlets ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                }`}
              >
                <MapPin className="w-3 h-3" />
                All Outlets
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isAllOutlets ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'}`}>
                  {orders.length}
                </span>
              </button>
              {outlets.map((outlet) => (
                <button
                  key={outlet.id}
                  onClick={() => setSelectedOutletId(outlet.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedOutletId === outlet.id ? 'bg-white text-black border-white' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {outlet.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedOutletId === outlet.id ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-500'}`}>
                    {orders.filter((o: any) => o.outletId === outlet.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto">
        <div className="grid gap-3">
          {filtered.map((order, i) => {
            const sc = statusConfig[order.status];
            const statusIdx = statusFlow.indexOf(order.status as typeof statusFlow[number]);
            const isExpanded = expandedItems[order.id] ?? false;
            const maxVisible = 3;
            const visibleItems = isExpanded ? order.items : order.items.slice(0, maxVisible);
            const hasMore = order.items.length > maxVisible;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedOrder(order)}
                className="bg-[#12121A] border border-zinc-800/60 hover:border-zinc-700/60 rounded-xl p-4 transition-all duration-200 cursor-pointer">
                <div className="flex flex-col gap-2.5">
                  {/* Top section: ID, customer, amount, status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                        <span className="font-semibold text-sm text-zinc-200">{order.id}</span>
                        <button onClick={(e) => { e.stopPropagation(); copyId(order.id); }} className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0" title="Copy ID">
                          {copiedId === order.id ? <span className="text-emerald-400 text-[10px] font-medium">Copied!</span> : <Copy className="w-3 h-3" />}
                        </button>
                        <div className="hidden sm:flex items-center gap-0.5">
                          {statusFlow.map((s, si) => (<div key={s} className={`w-1.5 h-1.5 rounded-full ${si <= statusIdx ? 'bg-white' : 'bg-zinc-700'}`} />))}
                        </div>
                      </div>
                      <p className="font-medium text-sm text-zinc-200 truncate">{order.customer}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <Phone className="w-3 h-3 shrink-0" />{order.phone}
                        <button onClick={(e) => { e.stopPropagation(); copyPhone(order.phone); }} className="p-0.5 hover:text-zinc-300 transition-colors shrink-0">{copied === order.phone ? <span className="text-emerald-400 text-[10px]">Copied!</span> : <Copy className="w-3 h-3" />}</button>
                        <a href={`tel:${order.phone}`} onClick={(e) => e.stopPropagation()} className="p-0.5 hover:text-zinc-300 shrink-0"><Phone className="w-3 h-3" /></a>
                        <span className="text-zinc-700">·</span><MapPin className="w-3 h-3 shrink-0" />{order.pickupTime}
                        {order.outletName && order.outletName !== (outlets.find(o => o.id === selectedOutletId)?.name) && !isAllOutlets && isMasterAdmin && (
                          <><span className="text-zinc-700">·</span><span className="text-zinc-500">{order.outletName}</span></>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right"><p className="font-semibold text-sm text-zinc-200">₹{order.amount}</p><p className="text-xs text-zinc-500">{order.createdAt}</p></div>
                      <div className="hidden sm:block text-right"><p className="font-semibold text-xs text-zinc-300">#{queuePosition(order.id)}</p><p className="text-[10px] text-zinc-500">Queue</p></div>
                      <div className="text-right">
                        <p className={`font-semibold text-xs ${pickupCountdown(order.pickupTime) === 'Overdue' ? 'text-red-400' : pickupCountdown(order.pickupTime) === 'Now' ? 'text-emerald-400' : 'text-zinc-300'}`}>{pickupCountdown(order.pickupTime)}</p>
                        <p className="text-[10px] text-zinc-500">{order.pickupTime}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${sc.pill}`}><span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}</span>
                    </div>
                  </div>

                  {/* Items section: vertical list, max 3 then expandable */}
                  <div className="flex flex-col gap-1">
                    {visibleItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-zinc-400 w-6 shrink-0 text-right">{item.qty}×</span>
                        <span className="text-zinc-300">{item.name}</span>
                      </div>
                    ))}
                    {hasMore && !isExpanded && (
                      <button onClick={(e) => { e.stopPropagation(); toggleItems(order.id); }} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-left mt-0.5">
                        +{order.items.length - maxVisible} more items
                      </button>
                    )}
                    {hasMore && isExpanded && (
                      <button onClick={(e) => { e.stopPropagation(); toggleItems(order.id); }} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-left mt-0.5">
                        Show less
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'received' && <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'preparing'); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"><ChefHat className="w-3 h-3" /> Start</button>}
                    {order.status === 'preparing' && <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'ready'); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"><CheckCircle className="w-3 h-3" /> Ready</button>}
                    {order.status === 'ready' && <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completed'); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"><Package className="w-3 h-3" /> Collect</button>}
                    {(order.status === 'received' || order.status === 'preparing') && <button onClick={(e) => { e.stopPropagation(); setConfirmAction('cancel'); setConfirmOrderId(order.id); setCancelReason(''); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"><Ban className="w-3 h-3" /> Cancel</button>}
                    {(order.status === 'completed' || order.status === 'cancelled') && <button onClick={(e) => { e.stopPropagation(); setConfirmAction('delete'); setConfirmOrderId(order.id); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"><Trash2 className="w-3 h-3" /> Delete</button>}
                    <button onClick={(e) => { e.stopPropagation(); printOrder(order); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-all"><Printer className="w-3 h-3" /> Print</button>
                    <a href={`https://wa.me/${(order.phone ?? '').replace(/\D/g, '')}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"><MessageCircle className="w-3 h-3" /> WhatsApp</a>
                    <a href={`tel:${order.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-all"><Phone className="w-3 h-3" /> Call</a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20"><ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-3" /><p className="text-zinc-600 font-medium text-sm">No orders match your filters</p></div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl z-10">
              <div className="sticky top-0 bg-[#12121A] border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[selectedOrder.status].dot}`} />
                  <h2 className="text-base font-bold text-white">{selectedOrder.id}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${statusConfig[selectedOrder.status].pill}`}>{statusConfig[selectedOrder.status].label}</span>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Progress</h3>
                  <div className="flex items-center gap-1">
                    {statusFlow.map((s, i) => {
                      const currentIdx = statusFlow.indexOf(selectedOrder.status as typeof statusFlow[number]);
                      const done = i <= currentIdx;
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${done ? 'bg-white text-black' : 'bg-zinc-800/50 text-zinc-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-black' : 'bg-zinc-600'}`} />{statusConfig[s].label}
                          </div>
                          {i < statusFlow.length - 1 && <div className={`flex-1 h-px mx-1 ${done && i < currentIdx ? 'bg-white' : 'bg-zinc-800'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Customer</h3><p className="text-sm font-medium text-white">{selectedOrder.customer}</p><p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{selectedOrder.phone}</p></div>
                  <div><h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Pickup</h3><p className="text-sm font-medium text-white flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedOrder.pickupTime}</p><p className="text-xs text-zinc-500 mt-0.5">{selectedOrder.createdAt}</p></div>
                  {selectedOrder.outletName && (isMasterAdmin || isAllOutlets) && (
                    <div className="col-span-2"><h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Outlet</h3><p className="text-sm font-medium text-white flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedOrder.outletName}</p></div>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Items</h3>
                  <div className="divide-y divide-zinc-800 border border-zinc-800/60 rounded-xl overflow-hidden">
                    {selectedOrder.items.map((item, i) => {
                      const itemTotal = Math.round(selectedOrder.amount / selectedOrder.items.reduce((s, it) => s + it.qty, 0) * item.qty);
                      return (<div key={i} className="flex items-center justify-between px-4 py-3"><div className="flex items-center gap-3"><span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{item.qty}×</span><span className="text-sm text-zinc-200">{item.name}</span></div><span className="text-sm font-medium text-zinc-200">₹{itemTotal}</span></div>);
                    })}
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/30 border-t border-zinc-800"><span className="text-sm font-bold text-white">Total</span><span className="text-base font-bold text-white">₹{selectedOrder.amount}</span></div>
                  </div>
                </div>
                {selectedOrder.notes && <div><h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Notes</h3><p className="text-sm text-zinc-400 bg-zinc-800/30 border border-zinc-800 rounded-lg px-3 py-2">{selectedOrder.notes}</p></div>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedOrder.status === 'received' && <button onClick={() => updateStatus(selectedOrder.id, 'preparing')} className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-zinc-200 transition-all"><ChefHat className="w-3.5 h-3.5" /> Start</button>}
                  {selectedOrder.status === 'preparing' && <button onClick={() => updateStatus(selectedOrder.id, 'ready')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-500 transition-all"><CheckCircle className="w-3.5 h-3.5" /> Ready</button>}
                  {selectedOrder.status === 'ready' && <button onClick={() => updateStatus(selectedOrder.id, 'completed')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-500 transition-all"><Package className="w-3.5 h-3.5" /> Collect</button>}
                  {(selectedOrder.status === 'received' || selectedOrder.status === 'preparing') && <button onClick={() => { setConfirmAction('cancel'); setConfirmOrderId(selectedOrder.id); setCancelReason(''); }} className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/10 transition-all"><Ban className="w-3.5 h-3.5" /> Cancel</button>}
                  {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && <button onClick={() => { setConfirmAction('delete'); setConfirmOrderId(selectedOrder.id); }} className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
                  <button onClick={() => printOrder(selectedOrder)} className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all"><Printer className="w-3.5 h-3.5" /> Print</button>
                  <a href={`tel:${selectedOrder.phone}`} className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all"><Phone className="w-3.5 h-3.5" /> Call</a>
                  <a href={`https://wa.me/${(selectedOrder.phone ?? '').replace(/\D/g, '')}`} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/10 transition-all"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cancel Confirmation Modal ── */}
      <AnimatePresence>
        {confirmAction === 'cancel' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => { setConfirmAction(null); setConfirmOrderId(''); setCancelReason(''); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl w-full max-w-md p-6 shadow-xl z-10"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Cancel Order</h2>
                  <p className="text-xs text-zinc-500">#{confirmOrderId}</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400 mb-4">Why is this order being cancelled?</p>

              {/* Preset reason chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {presetReasons.map(r => (
                  <button
                    key={r}
                    onClick={() => setCancelReason(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      cancelReason === r
                        ? 'bg-red-500/15 border-red-500/30 text-red-300'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Custom reason */}
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Or type a custom reason..."
                rows={3}
                className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 resize-none mb-5"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmAction(null); setConfirmOrderId(''); setCancelReason(''); }}
                  className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-sm font-medium rounded-xl hover:bg-zinc-800 transition-all"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => cancelOrder(confirmOrderId, cancelReason)}
                  disabled={!cancelReason.trim()}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {confirmAction === 'delete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => { setConfirmAction(null); setConfirmOrderId(''); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl w-full max-w-sm p-6 shadow-xl z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Delete Order</h2>
              <p className="text-sm text-zinc-400 mb-1">
                Are you sure you want to permanently delete order <span className="text-zinc-200 font-medium">#{confirmOrderId}</span>?
              </p>
              <p className="text-xs text-zinc-600 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmAction(null); setConfirmOrderId(''); }}
                  className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 text-sm font-medium rounded-xl hover:bg-zinc-800 transition-all"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => deleteOrder(confirmOrderId)}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-500 transition-all"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
