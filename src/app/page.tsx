'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import QuickDonateWidget from '@/components/QuickDonateWidget';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCached, setCached } from '@/lib/clientCache';
import {
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Paperclip,
  ShieldCheck,
  Scale,
  Gift,
  Sparkles,
  Radio,
} from 'lucide-react';
import { Marquee } from '@/components/ui/Marquee';
import { NumberTicker } from '@/components/ui/NumberTicker';

export default function DashboardPage() {
  const {
    user,
    isAuthenticated,
    setLoginModalOpen,
    setAddDepositModalOpen,
    setAddExpenseModalOpen,
    setAddDonationModalOpen,
    setLightboxAttachment,
    refreshTrigger,
  } = useAuth();

  const [data, setData] = useState<any>(() => getCached('dashboard'));
  const [loading, setLoading] = useState(() => !getCached('dashboard'));

  const fetchDashboardData = async () => {
    try {
      if (!data) setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setCached('dashboard', json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="h-36 bg-gray-200 rounded-2xl"></div>
          <div className="h-36 bg-gray-200 rounded-2xl"></div>
          <div className="h-36 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const {
    totalReceived = 0,
    totalExpenses = 0,
    currentBalance = 0,
    receivedFromFlats = 0,
    receivedFromOther = 0,
    expensesByCategory = [],
    recentActivity = [],
  } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* MAGIC UI LIVE ANNOUNCEMENT MARQUEE */}
      <div className="rounded-2xl border border-stone-200/90 bg-white/80 backdrop-blur-md p-1 shadow-2xs overflow-hidden w-full max-w-full">
        <div className="flex items-center w-full min-w-0 overflow-hidden">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-extrabold uppercase tracking-wider rounded-xl shrink-0 shadow-2xs">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-700" />
            <span>Live Updates</span>
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <Marquee pauseOnHover={true} className="text-xs font-bold text-stone-700">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5 text-stone-900 font-extrabold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Pari Tower Ganesh Utsav 2026
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1 text-stone-700">
                  ⚡ 100% Direct Bank UPI Transfer (0% Gateway Commission)
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  🛡️ Verified by Samiti Committee
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1 text-stone-700">
                  🏛️ Official Custodians: Suryakant Sabale & Rajeshwar Gawali
                </span>
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1 text-amber-800 font-bold">
                  🙏 Ganpati Bappa Morya! Mangal Murti Morya!
                </span>
                <span className="text-stone-300">•</span>
              </div>
            </Marquee>
          </div>
        </div>
      </div>

      {/* QUICK DONATION & CONTRIBUTION WIDGET (Top Section) */}
      <Suspense fallback={<div className="h-48 bg-stone-100 rounded-3xl animate-pulse" />}>
        <QuickDonateWidget />
      </Suspense>

      {/* TOP FINANCIAL CARDS (SMOOTHUI BENTO GRID + MAGICUI NUMBER TICKER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Total Received Bento Card */}
        <div className="bento-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Total Money Received
            </span>
            <div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-700 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform border border-emerald-100">
              <ArrowUpRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-baseline">
              <span className="text-xl sm:text-2xl mr-0.5 text-emerald-700 font-bold">₹</span>
              <NumberTicker value={totalReceived} className="font-black text-stone-900" />
            </div>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              From {receivedFromFlats > 0 ? `${receivedFromFlats} residents` : 'flat & online contributors'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
        </div>

        {/* Total Expenses Bento Card */}
        <div className="bento-card p-4 sm:p-5 rounded-2xl sm:rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Total Expenses
            </span>
            <div className="p-2 sm:p-2.5 bg-rose-50 text-rose-700 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform border border-rose-100">
              <ArrowDownRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-baseline">
              <span className="text-xl sm:text-2xl mr-0.5 text-rose-700 font-bold">₹</span>
              <NumberTicker value={totalExpenses} className="font-black text-stone-900" />
            </div>
            <p className="text-[11px] text-stone-500 font-medium mt-1">
              Across verified festival expenses
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-rose-600"></div>
        </div>

        {/* Current Balance Bento Card (Executive Dark Slate with Gold Accent) */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden border border-slate-800 group sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              CURRENT BALANCE
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-emerald-400 border border-white/10 text-[10px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Net In-Hand</span>
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline">
              <span className="text-2xl sm:text-3xl mr-0.5 text-amber-400 font-bold">₹</span>
              <NumberTicker value={currentBalance} className="font-black text-white" />
            </div>
            <p className="text-xs text-stone-400 font-medium mt-1">
              {formatCurrency(totalReceived)} received − {formatCurrency(totalExpenses)} spent
            </p>
          </div>
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        </div>
      </div>



      {/* RECENT FINANCIAL ACTIVITY FEED */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-stone-900 text-sm sm:text-lg truncate">Recent Activity (Last 2 Months)</h3>
            <p className="text-[11px] sm:text-xs text-stone-500 truncate">
              Live stream of money received, expenses, and donations.
            </p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-0.5 shrink-0"
          >
            Ledger →
          </Link>
        </div>

        <div className="divide-y divide-stone-100 mt-2">
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-sm">No activity recorded in the last 2 months.</div>
          ) : (
            recentActivity.map((item: any) => {
              const isDeposit = item.kind === 'deposit' || item.type === 'deposit';
              const isExpense = item.kind === 'expense' || item.type === 'expense';

              return (
                <div
                  key={`${item.type || item.kind}-${item.id}`}
                  className="py-3 sm:py-3.5 flex items-start justify-between gap-2.5 sm:gap-3 hover:bg-stone-50/60 rounded-xl px-1 sm:px-2 transition-colors"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 sm:p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isDeposit
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : isExpense
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isExpense ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-stone-900 truncate max-w-full">{item.title}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-200 shrink-0">
                          {item.festival || 'Ganesh Festival'}
                        </span>
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded shrink-0">
                          {item.paymentMethod || item.kind || item.type}
                        </span>
                        {item.attachments?.length > 0 && (
                          <button
                            onClick={() => setLightboxAttachment(item.attachments[0])}
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 active:scale-95 shrink-0"
                          >
                            <Paperclip className="w-3 h-3" />
                            Attachment
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">{item.details || item.subtitle}</p>
                      {item.notes && <p className="text-[10px] sm:text-[11px] text-gray-400 italic mt-0.5 line-clamp-1">{item.notes}</p>}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-1">
                    <div
                      className={`text-xs sm:text-base font-black ${
                        isDeposit
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {isDeposit && `+${formatCurrency(item.amount)}`}
                      {isExpense && `-${formatCurrency(Math.abs(item.amount))}`}
                      {!isDeposit && !isExpense && 'In-Kind'}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium block">
                      {formatDate(item.date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}