'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Bug, AlertTriangle, Search, Filter,
  CheckCircle, Clock, X, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

interface BugReport {
  id: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  pageUrl: string;
  userEmail: string;
  userName: string;
  status: 'open' | 'triaged' | 'in_progress' | 'resolved';
  adminNotes: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: 'Open', color: 'text-blue-400 border-blue-500/20 bg-blue-500/10', dot: 'bg-blue-500' },
  triaged: { label: 'Triaged', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', color: 'text-violet-400 border-violet-500/20 bg-violet-500/10', dot: 'bg-violet-500' },
  resolved: { label: 'Resolved', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10', dot: 'bg-emerald-500' },
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-zinc-500/10 text-zinc-400 border-zinc-600',
  major: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const NEXT_STATUS: Record<string, string> = {
  open: 'triaged',
  triaged: 'in_progress',
  in_progress: 'resolved',
  resolved: 'open',
};

export default function AdminBugs() {
  const { isMasterAdmin } = useAuth();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<BugReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMasterAdmin) return;
    if (!db) { setLoading(false); return; }
    const q = query(collection(db, 'bugReports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            description: data.description || '',
            severity: data.severity || 'minor',
            pageUrl: data.pageUrl || '',
            userEmail: data.userEmail || '',
            userName: data.userName || '',
            status: data.status || 'open',
            adminNotes: data.adminNotes || '',
            createdAt: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || '',
          } as BugReport;
        });
        setReports(entries);
        setLoading(false);
      },
      (error) => {
        console.warn('[bugs] onSnapshot error:', error);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.description.toLowerCase().includes(q) &&
            !r.userEmail.toLowerCase().includes(q) &&
            !r.userName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reports, statusFilter, search]);

  const updateStatus = async (id: string, status: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'bugReports', id), { status });
  };

  const saveNotes = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'bugReports', id), { adminNotes });
  };

  const openReport = (r: BugReport) => {
    setSelected(r);
    setAdminNotes(r.adminNotes);
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
            <Link href="/admin/dashboard" className="p-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Bug Reports</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Triage and manage reported issues</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600">
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 font-medium text-sm">No bug reports found</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                onClick={() => openReport(r)}
                className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:bg-zinc-800/40 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[r.severity]}`}>
                        {r.severity}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_CONFIG[r.status]?.color || ''}`}>
                        {STATUS_CONFIG[r.status]?.label || r.status}
                      </span>
                      {r.createdAt && (
                        <span className="text-[10px] text-zinc-600">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2">{r.description}</p>
                    <p className="text-xs text-zinc-600 mt-1">{r.userName || r.userEmail}</p>
                  </div>
                  <Bug className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#12121A] border border-zinc-800/60 rounded-2xl p-6 w-full max-w-lg shadow-xl z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Bug Report</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[selected.severity]}`}>{selected.severity}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_CONFIG[selected.status]?.color || ''}`}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1">Description</p>
                <p className="text-zinc-300 whitespace-pre-wrap">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-500">Submitted by</p>
                  <p className="text-zinc-300">{selected.userName || selected.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Date</p>
                  <p className="text-zinc-300">{selected.createdAt ? new Date(selected.createdAt).toLocaleString('en-IN') : '-'}</p>
                </div>
              </div>

              {selected.pageUrl && (
                <div>
                  <p className="text-xs text-zinc-500">Page</p>
                  <p className="text-zinc-400 text-xs truncate">{selected.pageUrl}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Admin Notes</label>
                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 resize-none"
                  rows={3} placeholder="Add internal notes..." />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { updateStatus(selected.id, NEXT_STATUS[selected.status]); setSelected(null); }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded-lg transition-all">
                Mark as {STATUS_CONFIG[NEXT_STATUS[selected.status]]?.label}
              </button>
              <button onClick={() => { saveNotes(selected.id); setSelected(null); }}
                className="px-4 py-2 border border-zinc-700 text-zinc-400 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-all">
                Save Notes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
