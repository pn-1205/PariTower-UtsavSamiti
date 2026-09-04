'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_FESTIVALS } from '@/lib/festivalUtils';
import {
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

interface CloseEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  festivalName: string;
  openingBalance: number;
  totalDonations: number;
  totalExpenses: number;
  closingBalance: number;
  onSuccess: (newFestivalName?: string) => void;
}

export default function CloseEventModal({
  isOpen,
  onClose,
  festivalName,
  openingBalance,
  totalDonations,
  totalExpenses,
  closingBalance,
  onSuccess,
}: CloseEventModalProps) {
  // Suggest next festival
  const nextSuggestions = DEFAULT_FESTIVALS.filter(
    (f) => f.toLowerCase() !== festivalName.toLowerCase() && f !== 'General / Society Events'
  );

  const [nextFestivalName, setNextFestivalName] = useState(nextSuggestions[0] || 'Navratri Festival');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCloseEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/festivals/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festivalName,
          nextFestivalName: nextFestivalName.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to close festival ledger');
      }

      onSuccess(nextFestivalName.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error closing event ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 border border-amber-400/30 text-amber-400 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Close & Freeze Event Ledger
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                Finalize & audit <span className="font-bold text-amber-300">{festivalName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCloseEvent} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Audit Financial Summary Breakdown */}
          <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 space-y-2.5">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
              Event Audit Statement
            </span>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Opening Balance (B/F):</span>
                <span className="font-bold text-stone-900">{formatCurrency(openingBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Total Donations Received (+):</span>
                <span className="font-bold text-emerald-700">+{formatCurrency(totalDonations)}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Total Event Expenses (-):</span>
                <span className="font-bold text-rose-700">-{formatCurrency(totalExpenses)}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wider block">
                  Balance Carried Forward (C/F)
                </span>
                <span className="text-[10px] text-stone-400">Transferred to next active event</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-amber-900">
                {formatCurrency(closingBalance)}
              </span>
            </div>
          </div>

          {/* Next Festival To Open */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-extrabold text-stone-700 uppercase tracking-wider">
              Next Festival / Event to Open:
            </label>
            <input
              type="text"
              required
              value={nextFestivalName}
              onChange={(e) => setNextFestivalName(e.target.value)}
              placeholder="e.g. Navratri Festival 2026"
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-stone-50 border border-stone-200 text-stone-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all"
            />

            {/* Quick-Pick Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-stone-400 font-bold self-center mr-1">Suggested:</span>
              {nextSuggestions.slice(0, 4).map((fest) => (
                <button
                  key={fest}
                  type="button"
                  onClick={() => setNextFestivalName(fest)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    nextFestivalName === fest
                      ? 'bg-amber-100/80 border-amber-300 text-amber-950 font-black'
                      : 'bg-stone-100/70 hover:bg-stone-200/70 border-stone-200 text-stone-700'
                  }`}
                >
                  {fest}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Remarks / Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-600">
              Audit Notes / Remarks (Optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visarjan complete, all idol & sound vendor payments settled."
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 text-stone-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Warning Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold">Accounting Rule:</span> Freezing locks this event's transactions into an audited record. The remaining surplus of <span className="font-black">{formatCurrency(closingBalance)}</span> will immediately become the Opening Balance for <span className="font-bold text-amber-950">{nextFestivalName || 'the next event'}</span>.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Freezing Ledger...' : 'Confirm & Freeze Ledger'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
