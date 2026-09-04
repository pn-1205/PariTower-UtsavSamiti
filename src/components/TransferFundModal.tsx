'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { X, ArrowRightLeft, Calendar, IndianRupee, FileText } from 'lucide-react';
import { DEFAULT_FESTIVALS } from '@/lib/festivalUtils';

export default function TransferFundModal() {
  const { transferFundModalOpen, setTransferFundModalOpen, triggerRefresh } = useAuth();
  const [festivalList, setFestivalList] = useState<string[]>(DEFAULT_FESTIVALS);
  const [fromFestival, setFromFestival] = useState<string>('Ganesh Festival');
  const [toFestival, setToFestival] = useState<string>('Navratri Festival');
  const [amount, setAmount] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/festivals');
        if (res.ok) {
          const d = await res.json();
          if (d.festivals) {
            setFestivalList(Array.from(new Set([...DEFAULT_FESTIVALS, ...d.festivals])));
          }
        }
      } catch (e) {}
    }
    if (transferFundModalOpen) load();
  }, [transferFundModalOpen]);

  if (!transferFundModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fromFestival === toFestival) {
      setError('Source and Destination festivals must be different.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromFestival,
          toFestival,
          amount: numAmount,
          transferDate,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to complete fund transfer.');
      } else {
        triggerRefresh();
        setTransferFundModalOpen(false);
        setAmount('');
        setNotes('');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-rose-100">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ArrowRightLeft className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Inter-Festival Fund Transfer</h3>
              <p className="text-xs text-amber-300">Move surplus between festival ledgers</p>
            </div>
          </div>
          <button
            onClick={() => setTransferFundModalOpen(false)}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
              {error}
            </div>
          )}

          {/* Festival Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div>
              <label className="block text-[11px] font-bold text-rose-900 uppercase tracking-wider mb-1">
                From Festival (Debit)
              </label>
              <select
                value={fromFestival}
                onChange={(e) => setFromFestival(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-800 focus:outline-none"
              >
                {festivalList.map((f) => (
                  <option key={`from-${f}`} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                To Festival (Credit)
              </label>
              <select
                value={toFestival}
                onChange={(e) => setToFestival(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {festivalList.map((f) => (
                  <option key={`to-${f}`} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Transfer Amount (₹) *
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Transfer Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Transfer Purpose / Committee Note
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Surplus allocation for Navratri Utsav 2026"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Transparency Explanation */}
          <p className="text-[11px] text-gray-500 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50">
            ℹ️ <strong>Double-Entry Rule:</strong> This automatically records an outgoing transfer expense in <em>{fromFestival}</em> and an incoming transfer deposit in <em>{toFestival}</em>. Society total cash balance remains unchanged.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTransferFundModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Processing Transfer...' : 'Complete Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}