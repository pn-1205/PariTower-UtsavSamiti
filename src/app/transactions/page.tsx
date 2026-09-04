'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCached, setCached } from '@/lib/clientCache';
import {
  FESTIVAL_OPTIONS,
  FY_OPTIONS,
  getCurrentFinancialYear,
} from '@/lib/festivalUtils';
import TopFestivalSelector from '@/components/TopFestivalSelector';
import {
  BookOpen,
  Search,
  Paperclip,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Landmark,
  Wallet,
} from 'lucide-react';

export default function TransactionsPage() {
  const { setLightboxAttachment, setTransferFundModalOpen, isAuthenticated, refreshTrigger } = useAuth();
  const [transactions, setTransactions] = useState<any[]>(() => getCached('transactions') || []);
  const [loading, setLoading] = useState(() => !getCached('transactions'));
  const [custodianBalances, setCustodianBalances] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(() => getCached('summaryData') || {
    totalReceived: 0,
    totalExpenses: 0,
    currentBalance: 0,
  });

  // Top Selectors
  const [selectedFy, setSelectedFy] = useState<string>(getCurrentFinancialYear());
  const [selectedFestival, setSelectedFestival] = useState<string>('all');

  // Table In-Page Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'donation'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactionsAndSummary = async () => {
    try {
      if (transactions.length === 0) setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (selectedFestival !== 'all') params.set('festival', selectedFestival);
      if (selectedFy !== 'all') params.set('fy', selectedFy);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.transactions || []);
        if (json.custodianBalances) {
          setCustodianBalances(json.custodianBalances);
        }
        if (json.totals) {
          const sumObj = {
            totalReceived: json.totals.totalIncome,
            totalExpenses: json.totals.totalExpense,
            currentBalance: json.totals.netBalance,
          };
          setSummaryData(sumObj);
          if (typeFilter === 'all' && selectedFestival === 'all' && selectedFy === 'all' && !searchQuery.trim()) {
            setCached('transactions', json.transactions || []);
            setCached('summaryData', sumObj);
          }
        }
      }
    } catch (e) {
      console.error('Ledger fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsAndSummary();
  }, [typeFilter, selectedFestival, selectedFy, searchQuery, refreshTrigger]);

  const exportOptions = {
    festival: selectedFestival,
    fy: selectedFy,
  };

  const handleExcelExport = async () => {
    const { exportLedgerToExcel } = await import('@/lib/exportLedger');
    exportLedgerToExcel(transactions, summaryData, exportOptions);
  };

  const handlePdfExport = async () => {
    const { exportLedgerToPdf } = await import('@/lib/exportLedger');
    exportLedgerToPdf(transactions, summaryData, exportOptions);
  };

  const handleCsvExport = async () => {
    const { exportLedgerToCsv } = await import('@/lib/exportLedger');
    exportLedgerToCsv(transactions, exportOptions);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-rose-900" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Unified General Ledger</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Single chronological record of all festival money received, expenses, donations & inter-festival fund transfers.
          </p>
        </div>

        {/* 3 Dedicated Export Options: PDF, Excel, CSV */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePdfExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            title="Download printable PDF ledger as on date"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>

          <button
            onClick={handleExcelExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Download formatted Excel spreadsheet (.xlsx)"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={handleCsvExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Download raw CSV file (.csv)"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Modern Top-of-Screen Festival & FY Selector + Transfer Fund Action */}
      <TopFestivalSelector
        selectedFy={selectedFy}
        onFyChange={setSelectedFy}
        selectedFestival={selectedFestival}
        onFestivalChange={setSelectedFestival}
        showTransferButton={isAuthenticated}
        onOpenTransferModal={() => setTransferFundModalOpen(true)}
      />

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800">
            <span>Total Inflow</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {formatCurrency(summaryData.totalReceived)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {selectedFestival === 'all' ? 'All festivals' : selectedFestival} • {selectedFy === 'all' ? 'All years' : `FY ${selectedFy}`}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-800">
            <span>Total Outflow</span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-2">
            {formatCurrency(summaryData.totalExpenses)}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {selectedFestival === 'all' ? 'All festivals' : selectedFestival} • {selectedFy === 'all' ? 'All years' : `FY ${selectedFy}`}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-300">
            <span>Net Balance</span>
            <span className="text-[10px] bg-white/10 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              Filtered Cash
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatCurrency(summaryData.currentBalance)}
          </div>
          <div className="text-[11px] text-rose-200/80 mt-0.5">
            Surplus balance available
          </div>
        </div>
      </div>

      {/* Custodian / Personal Accounts Balance Breakdown */}
      {custodianBalances.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Custodian Accounts & Cash Holding</h3>
              <p className="text-[11px] text-gray-500">Live breakdown of funds held across personal committee accounts and cash in hand</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {custodianBalances.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-100/60 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-gray-900 block">{acc.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {acc.accountType === 'UPI_BANK' ? (acc.upiId || 'UPI') : 'Cash in Hand'}
                    </span>
                  </div>
                  <span className={`text-sm font-black ${acc.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(acc.balance)}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-medium">In: +{formatCurrency(acc.inflow)}</span>
                  <span className="text-rose-700 font-medium">Out: -{formatCurrency(acc.outflow)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar (Search + Type filter) */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by donor, flat number, vendor, category, festival..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-800 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-5 flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              typeFilter === 'income' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            Income (+)
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              typeFilter === 'expense' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            Expense (−)
          </button>
          <button
            onClick={() => setTypeFilter('donation')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              typeFilter === 'donation' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-600'
            }`}
          >
            Donations
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-bold">No transactions found for this selection.</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting the Financial Year or Festival filter above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {transactions.map((t) => {
            const isDeposit = t.kind === 'deposit';
            const isExpense = t.kind === 'expense';
            const isTransfer = t.category === 'Fund Transfer' || t.paymentMethod === 'Internal Transfer';

            return (
              <div
                key={`${t.kind}-${t.id}`}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isTransfer
                        ? 'bg-purple-50 text-purple-700'
                        : isDeposit
                        ? 'bg-emerald-50 text-emerald-600'
                        : isExpense
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {isTransfer ? (
                      <ArrowRightLeft className="w-4 h-4" />
                    ) : isDeposit ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : isExpense ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <Gift className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 truncate max-w-full">{t.party}</span>
                      
                      {/* Festival Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200/70 shrink-0">
                        {t.festival || 'Ganesh Festival'}
                      </span>

                      {/* Category Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isTransfer
                            ? 'bg-purple-100 text-purple-800'
                            : isDeposit
                            ? 'bg-emerald-100 text-emerald-800'
                            : isExpense
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.category}
                      </span>

                      {/* Account Badge */}
                      {t.accountName && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {t.accountName}
                        </span>
                      )}

                      {t.attachments?.length > 0 && (
                        <button
                          onClick={() => setLightboxAttachment(t.attachments[0])}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200"
                        >
                          <Paperclip className="w-3 h-3" /> View Attachment
                        </button>
                      )}
                    </div>
                    {t.title && t.title !== t.party && (
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{t.title}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDate(t.date)} • Handled by <span className="font-medium text-gray-600">{t.user}</span>
                      {t.paymentMethod ? ` • ${t.paymentMethod}` : ''}
                      {t.utrNumber && (
                        <span className="font-mono ml-1.5 text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                          UTR: {t.utrNumber}
                        </span>
                      )}
                      {t.notes && <span className="italic ml-1">({t.notes})</span>}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  {isDeposit ? (
                    <span className="text-base sm:text-lg font-black text-emerald-600 tracking-tight">
                      +{formatCurrency(t.amount)}
                    </span>
                  ) : isExpense ? (
                    <span className="text-base sm:text-lg font-black text-rose-600 tracking-tight">
                      -{formatCurrency(Math.abs(t.amount))}
                    </span>
                  ) : (
                    <div>
                      <span className="text-sm font-bold text-amber-700">In-Kind</span>
                      {t.estimatedValue && (
                        <div className="text-[10px] text-gray-400">
                          Est. {formatCurrency(t.estimatedValue)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}