'use client';

import React, { Suspense } from 'react';
import QuickDonateWidget from '@/components/QuickDonateWidget';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

function DonatePageContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Main Donation Widget */}
      <QuickDonateWidget />

      {/* Transparency Note */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm text-xs text-stone-600 space-y-2">
        <div className="flex items-center gap-2 font-black text-stone-900 text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          100% Financial Transparency
        </div>
        <p>
          Every contribution paid via UPI is transferred directly into the designated committee member bank account with 0% gateway commission. Once matched with the bank transaction record by amount, time, and name, it is approved into the public General Ledger.
        </p>
      </div>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-8 animate-pulse text-stone-400">Loading donation page...</div>}>
      <DonatePageContent />
    </Suspense>
  );
}