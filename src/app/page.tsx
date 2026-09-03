'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Paperclip,
  ShieldCheck,
  Scale,
  Gift,
} from 'lucide-react';

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

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Welcome & Public Transparency Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-4 sm:p-5 rounded-2xl border border-orange-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-600 text-white rounded-lg text-xs font-black">PTUS</span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Pari Tower Utsav Samiti
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Real-time financial transparency for all 262 Pari Tower residences.
          </p>
        </div>

        {/* Action button / Status badge */}
        <div>
          {isAuthenticated ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAddDepositModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                + Deposit
              </button>
              <button
                onClick={() => setAddExpenseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                + Expense
              </button>
              <button
                onClick={() => setAddDonationModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                + Donation
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-xl border border-orange-200 text-xs text-orange-950 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Public Transparency View</span>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="ml-2 font-bold text-orange-600 hover:text-orange-700 underline"
              >
                Admin Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOP FINANCIAL CARDS (HIGHLIGHTED BALANCE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Received */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Money Received
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(totalReceived)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Flats ({formatCurrency(receivedFromFlats)}) + Other ({formatCurrency(receivedFromOther)})
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Total Expenses
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-rose-600 font-medium mt-1">
              Decorations, Sound, Catering & Venue
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
        </div>

        {/* Current Balance (HIGH VISIBILITY) */}
        <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white p-5 rounded-2xl shadow-lg shadow-orange-600/20 hover:shadow-xl transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100 flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              CURRENT BALANCE
            </span>
            <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur">
              Net Cash
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-orange-100 font-medium mt-1">
              {formatCurrency(totalReceived)} received − {formatCurrency(totalExpenses)} spent
            </p>
          </div>
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        </div>
      </div>



      {/* RECENT FINANCIAL ACTIVITY FEED */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">Recent Financial Activity</h3>
            <p className="text-xs text-gray-500">
              Live chronological stream of deposits, expenses, and donations.
            </p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
          >
            Complete Ledger →
          </Link>
        </div>

        <div className="divide-y divide-gray-100 mt-2">
          {recentActivity.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No activity recorded yet.</div>
          ) : (
            recentActivity.map((item: any) => {
              const isDeposit = item.kind === 'deposit';
              const isExpense = item.kind === 'expense';

              return (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50/60 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
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

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">{item.title}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {item.paymentMethod || item.kind}
                        </span>
                        {item.attachments?.length > 0 && (
                          <button
                            onClick={() => setLightboxAttachment(item.attachments[0])}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 active:scale-95"
                          >
                            <Paperclip className="w-3 h-3" />
                            View Attachment
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                      {item.notes && <p className="text-[11px] text-gray-400 italic mt-0.5">{item.notes}</p>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm sm:text-base font-black ${
                        isDeposit
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {isDeposit && `+${formatCurrency(item.amount)}`}
                      {isExpense && `-${formatCurrency(item.amount)}`}
                      {!isDeposit && !isExpense && 'In-Kind'}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
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