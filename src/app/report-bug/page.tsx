'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bug, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SEVERITIES = [
  { value: 'minor', label: 'Minor', desc: 'Cosmetic issue, typo, minor UI glitch' },
  { value: 'major', label: 'Major', desc: 'Feature broken, incorrect data, payment issue' },
  { value: 'critical', label: 'Critical', desc: 'App crashes, data loss, security issue' },
];

export default function ReportBug() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'major' | 'critical'>('major');
  const [pageUrl, setPageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth?redirect=/report-bug');
      return;
    }
    setPageUrl(document.referrer || '/');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('Please provide at least 10 characters describing the issue.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (db) {
        await addDoc(collection(db, 'bugReports'), {
          description: description.trim(),
          severity,
          pageUrl,
          userEmail: user?.email || '',
          userName: user?.name || '',
          status: 'open',
          adminNotes: '',
          createdAt: serverTimestamp(),
        });
      }
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Report Submitted</h1>
          <p className="text-sm text-zinc-400 mb-6">Thank you for helping us improve Crave. Our team will review your report shortly.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-all">
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-all mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Bug className="w-6 h-6 text-zinc-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Report a Bug</h1>
            <p className="text-sm text-zinc-500">Found something broken? Let us know.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITIES.map((s) => (
                <button key={s.value} type="button" onClick={() => setSeverity(s.value as typeof severity)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    severity === s.value
                      ? 'bg-zinc-800 border-zinc-600'
                      : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className={`w-3 h-3 ${severity === s.value ? 'text-zinc-300' : 'text-zinc-600'}`} />
                    <span className={`text-xs font-medium ${severity === s.value ? 'text-white' : 'text-zinc-400'}`}>{s.label}</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-tight">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What went wrong? Include steps to reproduce if possible..."
              className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 resize-none"
              rows={6} />
            <p className="text-[10px] text-zinc-600 mt-1">{description.length} characters (min 10)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Page URL (auto-detected)</label>
            <input type="text" value={pageUrl} readOnly
              className="w-full px-3 py-2 bg-zinc-800/30 border border-zinc-800 rounded-lg text-sm text-zinc-500 cursor-not-allowed" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <button type="submit" disabled={submitting || description.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
          >
            {submitting ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Submit Report</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
