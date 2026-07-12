'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Search, Clock, Filter, Download, FileText,
  AlertTriangle, Calendar, User, Activity, Store, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { adminPath } from '@/lib/admin-slug';

interface LogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, any>;
  userEmail: string;
  userRole: string;
  userName: string;
  outletId: string;
  outletName: string;
  createdAt: string;
  expireAt?: Timestamp;
}

const ACTION_LABELS: Record<string, string> = {
  'order.created': 'Order Created',
  'order.status_changed': 'Status Changed',
  'order.cancelled': 'Order Cancelled',
  'menu.created': 'Menu Added',
  'menu.updated': 'Menu Updated',
  'menu.deleted': 'Menu Deleted',
  'outlet.created': 'Outlet Created',
  'outlet.updated': 'Outlet Updated',
  'outlet.deleted': 'Outlet Deleted',
  'settings.updated': 'Settings Updated',
  'settings.reset': 'Settings Reset',
  'data.cleared': 'Data Cleared',
  'data.seeded': 'Data Seeded',
};

const ACTION_COLORS: Record<string, string> = {
  'order.created': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'order.status_changed': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'order.cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
  'menu.created': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'menu.updated': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'menu.deleted': 'bg-red-500/10 text-red-400 border-red-500/20',
  'outlet.created': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'outlet.updated': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'outlet.deleted': 'bg-red-500/10 text-red-400 border-red-500/20',
  'settings.updated': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'settings.reset': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'data.cleared': 'bg-red-500/10 text-red-400 border-red-500/20',
  'data.seeded': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function getDaysUntilPurge(expireAt: Timestamp | undefined): number {
  if (!expireAt) return 30;
  const ms = expireAt.toDate().getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function AdminLogs() {
  const { isMasterAdmin } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMasterAdmin) return;
    if (!db) { setLoading(false); return; }
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(500)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            action: data.action || '',
            targetType: data.targetType || '',
            targetId: data.targetId || '',
            details: data.details || {},
            userEmail: data.userEmail || '',
            userRole: data.userRole || '',
            userName: data.userName || '',
            outletId: data.outletId || '',
            outletName: data.outletName || '',
            createdAt: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || '',
            expireAt: data.expireAt,
          } as LogEntry;
        });
        setLogs(entries);
        setLoading(false);
      },
      (error) => {
        console.warn('[logs] onSnapshot error:', error);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const uniqueEmails = useMemo(() => [...new Set(logs.map((l) => l.userEmail).filter(Boolean))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (userFilter && l.userEmail !== userFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.targetId.toLowerCase().includes(q) &&
            !l.userEmail.toLowerCase().includes(q) &&
            !l.userName.toLowerCase().includes(q) &&
            !l.targetType.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, userFilter, search]);

  const daysUntilPurge = useMemo(() => {
    if (logs.length === 0) return 30;
    return getDaysUntilPurge(logs[0].expireAt);
  }, [logs]);

  const exportAsCSV = () => {
    const headers = ['Timestamp', 'Action', 'Target Type', 'Target ID', 'User Email', 'User Name', 'Role', 'Outlet', 'Details'];
    const rows = filtered.map((l) => [
      l.createdAt,
      ACTION_LABELS[l.action] || l.action,
      l.targetType,
      l.targetId,
      l.userEmail,
      l.userName,
      l.userRole,
      l.outletName || '-',
      JSON.stringify(l.details),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Audit Logs', 14, 20);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 27);
    doc.text(`Total Entries: ${filtered.length}`, 14, 32);
    autoTable(doc, {
      startY: 37,
      head: [['Timestamp', 'Action', 'User', 'Target', 'Outlet']],
      body: filtered.slice(0, 100).map((l) => [
        l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '-',
        ACTION_LABELS[l.action] || l.action,
        l.userName || l.userEmail,
        `${l.targetType}:${l.targetId.slice(0, 12)}`,
        l.outletName || '-',
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 40] },
    });
    doc.save(`audit-logs-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 font-medium">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="bg-[#0D0D14] border-b border-zinc-800/60">
        <div className="px-6 sm:px-8 py-5">
          <div className="flex items-center gap-4 mb-4">
            <Link href={adminPath('dashboard')} className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Audit Logs</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Track every action across the platform</p>
            </div>
          </div>

          {daysUntilPurge <= 7 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">
                Logs older than 30 days will be purged in <strong>{daysUntilPurge} {daysUntilPurge === 1 ? 'day' : 'days'}</strong>.
                <button onClick={exportAsCSV} className="ml-2 underline hover:text-amber-200">Download CSV</button>
                <button onClick={exportAsPDF} className="ml-2 underline hover:text-amber-200">Download PDF</button>
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input type="text" placeholder="Search by ID, email, user..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
            </div>
            <div className="flex gap-2">
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600">
                <option value="all">All Actions</option>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600">
                <option value="">All Users</option>
                {uniqueEmails.map((email) => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
              <button onClick={exportAsCSV} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-all border border-zinc-700">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={exportAsPDF} className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-all border border-zinc-700">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto">
        <div className="space-y-1.5">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-medium text-sm">No log entries found</div>
          ) : (
            filtered.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.008 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${entry.action.includes('deleted') || entry.action === 'order.cancelled' ? 'bg-red-500' : entry.action.includes('created') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${ACTION_COLORS[entry.action] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400 space-x-1">
                    <span className="text-zinc-300 font-medium">{entry.userName || entry.userEmail}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">{entry.targetType}</span>
                    <span className="text-zinc-600">·</span>
                    <code className="text-[10px] text-zinc-500 bg-zinc-800 px-1 rounded">{entry.targetId}</code>
                    {entry.outletName && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-500">{entry.outletName}</span>
                      </>
                    )}
                  </div>
                  {Object.keys(entry.details).length > 0 && (
                    <div className="mt-1 text-[10px] text-zinc-600 font-mono truncate max-w-xl">
                      {JSON.stringify(entry.details)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
