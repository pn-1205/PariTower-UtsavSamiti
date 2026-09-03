'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportLedgerToExcel, exportLedgerToPdf, exportLedgerToCsv } from '@/lib/exportLedger';
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
} from 'lucide-react';

export default function TransactionsPage() {
  const { setLightboxAttachment, refreshTrigger } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'donation'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactionsAndSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const [tRes, dRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`),
        fetch('/api/dashboard'),
      ]);

      if (tRes.ok) {
        const json = await tRes.json();
        setTransactions(json.transactions || []);
      }
      if (dRes.ok) {
        const dJson = await dRes.json();
        setSummaryData({
          totalReceived: dJson.totalReceived,
          totalExpenses: dJson.totalExpenses,
          currentBalance: dJson.currentBalance,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsAndSummary();
  }, [typeFilter, searchQuery, refreshTrigger]);

  const handleExcelExport = () => {
    exportLedgerToExcel(transactions, summaryData);
  };

  const handlePdfExport = () => {
    exportLedgerToPdf(transactions, summaryData);
  };

  const handleCsvExport = () => {
    exportLedgerToCsv(transactions);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-600" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Unified General Ledger</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Single chronological record of all festival money received, expenses, and donations.
          </p>
        </div>

        {/* 3 Dedicated Export Options: PDF, Excel, CSV */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePdfExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Download printable PDF ledger as on date"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>

          <button
            onClick={handleExcelExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Download formatted Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={handleCsvExport}
            disabled={transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Download raw CSV data"
          >
            <FileCode className="w-4 h-4 text-orange-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by donor, flat number, vendor, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
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
          <p className="text-gray-700 font-bold">No transactions found.</p>
          <p className="text-xs text-gray-400 mt-1">Ready for festival entries.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {transactions.map((t) => {
            const isDeposit = t.kind === 'deposit';
            const isExpense = t.kind === 'expense';

            return (
              <div
                key={`${t.kind}-${t.id}`}
                className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isDeposit
                        ? 'bg-emerald-50 text-emerald-600'
                        : isExpense
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-amber-50 text-amber-600'
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
                      <span className="font-bold text-sm text-gray-900">{t.party}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDeposit
                            ? 'bg-emerald-100 text-emerald-800'
                            : isExpense
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.category}
                      </span>
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
                      {formatDate(t.date)} • Handled by: {t.user}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-base font-black ${
                      isDeposit
                        ? 'text-emerald-600'
                        : isExpense
                        ? 'text-rose-600'
                        : 'text-amber-800'
                    }`}
                  >
                    {isDeposit && `+${formatCurrency(t.amount)}`}
                    {isExpense && `-${formatCurrency(Math.abs(t.amount))}`}
                    {!isDeposit && !isExpense && 'In-Kind'}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    {t.paymentMethod}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}