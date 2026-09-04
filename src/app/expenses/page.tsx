'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate, downloadCsv, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils';
import { getCached, setCached } from '@/lib/clientCache';
import {
  TrendingDown,
  Search,
  Download,
  PlusCircle,
  Paperclip,
  Trash2,
  Tag,
  Store,
  FileSpreadsheet,
  FileText,
  FileCode,
  CreditCard,
  Layers,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import TopFestivalSelector from '@/components/TopFestivalSelector';
import CustomSelect from '@/components/ui/CustomSelect';
import { getCurrentFinancialYear } from '@/lib/festivalUtils';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const METHOD_OPTIONS = [
  { value: 'all', label: 'All Payment Methods' },
  ...PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
];

export default function ExpensesPage() {
  const {
    user,
    isAuthenticated,
    setAddExpenseModalOpen,
    setLightboxAttachment,
    refreshTrigger,
    triggerRefresh,
  } = useAuth();

  const [expenses, setExpenses] = useState<any[]>(() => getCached('expenses') || []);
  const [loading, setLoading] = useState(() => !getCached('expenses'));

  // Top Filter Selectors
  const [selectedFy, setSelectedFy] = useState<string>(getCurrentFinancialYear());
  const [selectedFestival, setSelectedFestival] = useState<string>('all');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Delete modal
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFestival !== 'all') params.set('festival', selectedFestival);
      if (selectedFy !== 'all') params.set('fy', selectedFy);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (methodFilter !== 'all') params.set('method', methodFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.expenses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedFestival, selectedFy, searchQuery, categoryFilter, methodFilter, refreshTrigger]);

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleExportPdf = async () => {
    const { exportExpensesToPdf } = await import('@/lib/exportLedger');
    exportExpensesToPdf(expenses, totalAmount);
  };

  const handleExportExcel = async () => {
    const { exportExpensesToExcel } = await import('@/lib/exportLedger');
    exportExpensesToExcel(expenses, totalAmount);
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Paid To', 'Payment Method', 'Entered By', 'Notes'];
    const rows = expenses.map((e) => [
      formatDate(e.expenseDate),
      `"${e.expenseCategory}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.paidTo || '').replace(/"/g, '""')}"`,
      e.paymentMethod,
      `"${e.enteredByUser.name}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv('ptfc_festival_expenses.csv', csvContent);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteItem.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteItem(null);
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-600" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Festival Expenses</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Detailed expenditure tracking for stage, sound, catering, printing, and vendors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPdf}
            disabled={expenses.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50"
            title="Download printable Expenses PDF"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>

          <button
            onClick={handleExportExcel}
            disabled={expenses.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50"
            title="Download Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={handleExportCsv}
            disabled={expenses.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50"
            title="Download raw CSV data"
          >
            <FileCode className="w-4 h-4 text-rose-600" />
            Export CSV
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setAddExpenseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 ml-1"
            >
              <PlusCircle className="w-4 h-4" />
              + Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Modern Top-of-Screen Festival & FY Selector */}
      <TopFestivalSelector
        selectedFy={selectedFy}
        onFyChange={setSelectedFy}
        selectedFestival={selectedFestival}
        onFestivalChange={setSelectedFestival}
      />

      {/* Summary Banner */}
      <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
            Total Displayed Expenses
          </span>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 mt-0.5">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="text-xs font-semibold text-rose-800 bg-white px-3 py-1.5 rounded-xl border border-rose-200">
          {expenses.length} expense records
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/95 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl shadow-sm border border-stone-200/90 grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 relative z-10">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by vendor, item, description, receiver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 text-stone-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        <div className="sm:col-span-3">
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORY_OPTIONS}
            headerLabel="Filter By Category"
            icon={Tag}
          />
        </div>

        <div className="sm:col-span-3">
          <CustomSelect
            value={methodFilter}
            onChange={setMethodFilter}
            options={METHOD_OPTIONS}
            headerLabel="Filter By Payment Method"
            icon={CreditCard}
          />
        </div>
      </div>

      {/* Responsive Table / Cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
          <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-bold">No expenses recorded yet.</p>
          <p className="text-xs text-gray-400 mt-1">Start tracking festival expenditures.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards (visible < md) */}
          <div className="md:hidden space-y-3">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200/70">
                        {e.festival || 'Ganesh Festival'}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {e.expenseCategory}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 mt-1">{e.description}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      Paid to: <span className="font-semibold text-gray-800">{e.paidTo}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-rose-600">
                      -{formatCurrency(e.amount)}
                    </div>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                      {e.paymentMethod}
                    </span>
                  </div>
                </div>

                {e.notes && <p className="text-xs text-gray-500 italic">{e.notes}</p>}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="text-gray-500">
                    {formatDate(e.expenseDate)} • Entered by:{' '}
                    <span className="font-bold text-gray-800">{e.enteredByUser.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {e.attachments?.length > 0 && (
                      <button
                        onClick={() => setLightboxAttachment(e.attachments[0])}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> View Attachment Attachment</button>
                    )}

                    {isAuthenticated && (
                      <button
                        onClick={() => setDeleteItem(e)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (visible >= md) */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Festival</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Paid To</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Entered By</th>
                  <th className="px-5 py-3.5">Attachment</th>
                  {isAuthenticated && <th className="px-5 py-3.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap font-medium text-xs">
                      {formatDate(e.expenseDate)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-900 border border-rose-200">
                        {e.festival || 'Ganesh Festival'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">
                        {e.expenseCategory}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {e.description}
                      {e.notes && <p className="text-xs text-gray-400 italic">{e.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5 font-black text-rose-600 whitespace-nowrap">
                      -{formatCurrency(e.amount)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                      {e.paidTo}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                      {e.paymentMethod}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {e.enteredByUser.name}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {e.attachments?.length > 0 ? (
                        <button
                          onClick={() => setLightboxAttachment(e.attachments[0])}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200"
                        >
                          <Paperclip className="w-3 h-3" /> View Attachment Attachment</button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    {isAuthenticated && (
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDeleteItem(e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          title="Delete Expense Record?"
          itemDetails={{
            amount: deleteItem.amount,
            party: deleteItem.paidTo,
            date: formatDate(deleteItem.expenseDate),
            description: `${deleteItem.expenseCategory} • ${deleteItem.description}`,
          }}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteItem(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}