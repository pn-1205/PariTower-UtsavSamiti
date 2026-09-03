'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate, downloadCsv } from '@/lib/utils';
import { getCached, setCached } from '@/lib/clientCache';
import {
  DollarSign,
  Search,
  Download,
  PlusCircle,
  Paperclip,
  Trash2,
  Building2,
  User,
  Filter,
  FileSpreadsheet,
  FileText,
  FileCode,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import TopFestivalSelector from '@/components/TopFestivalSelector';
import { getCurrentFinancialYear } from '@/lib/festivalUtils';

export default function DepositsPage() {
  const {
    user,
    isAuthenticated,
    setAddDepositModalOpen,
    setLightboxAttachment,
    refreshTrigger,
    triggerRefresh,
  } = useAuth();

  const [deposits, setDeposits] = useState<any[]>(() => getCached('deposits') || []);
  const [loading, setLoading] = useState(() => !getCached('deposits'));

  // Top Filter Selectors
  const [selectedFy, setSelectedFy] = useState<string>(getCurrentFinancialYear());
  const [selectedFestival, setSelectedFestival] = useState<string>('all');

  // Filters
  const [methodFilter, setMethodFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirm modal state
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFestival !== 'all') params.set('festival', selectedFestival);
      if (selectedFy !== 'all') params.set('fy', selectedFy);
      if (methodFilter !== 'all') params.set('method', methodFilter);
      if (sourceFilter !== 'all') params.set('type', sourceFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/deposits?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDeposits(json.deposits || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [selectedFestival, selectedFy, methodFilter, sourceFilter, searchQuery, refreshTrigger]);

  const totalAmount = deposits.reduce((acc, d) => acc + (d.amount || 0), 0);

  const handleExportPdf = async () => {
    const { exportDepositsToPdf } = await import('@/lib/exportLedger');
    exportDepositsToPdf(deposits, totalAmount);
  };

  const handleExportExcel = async () => {
    const { exportDepositsToExcel } = await import('@/lib/exportLedger');
    exportDepositsToExcel(deposits, totalAmount);
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Donor Name', 'Flat / Source', 'Amount (INR)', 'Payment Method', 'Received By', 'Notes'];
    const rows = deposits.map((d) => [
      formatDate(d.receivedDate),
      `"${d.donorName || d.contributor.name}"`,
      `"${d.contributor.flat?.altName ? `Flat ${d.contributor.flat.altName}` : d.contributor.name}"`,
      d.amount,
      d.paymentMethod,
      `"${d.receivedByUser.name}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv('ptfc_money_received.csv', csvContent);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/deposits/${deleteItem.id}`, {
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
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Money Received</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Verified records of contributions received from flats and sponsors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPdf}
            disabled={deposits.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50"
            title="Download printable Money Received PDF"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>

          <button
            onClick={handleExportExcel}
            disabled={deposits.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50"
            title="Download Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>

          <button
            onClick={handleExportCsv}
            disabled={deposits.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50"
            title="Download raw CSV data"
          >
            <FileCode className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setAddDepositModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 ml-1"
            >
              <PlusCircle className="w-4 h-4" />
              + Add Deposit
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by donor name, flat (e.g. 808), notes, receiver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Source selector */}
        <div className="sm:col-span-3">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          >
            <option value="all">All Sources (Flats & Others)</option>
            <option value="flat">Flats Only</option>
            <option value="other">External Contributors Only</option>
          </select>
        </div>

        {/* Payment method selector */}
        <div className="sm:col-span-4">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Responsive Cards (Mobile) / Table (Desktop) */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      ) : deposits.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-bold">No deposits found.</p>
          <p className="text-xs text-gray-400 mt-1">Try changing your filters or add a new deposit.</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {deposits.map((d) => {
              const flatNo = d.contributor.flat?.altName || d.contributor.flat?.displayName?.replace('-', '');
              return (
                <div
                  key={d.id}
                  className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 text-base">
                        {d.contributor.contributorType === 'flat' ? (
                          <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
                        ) : (
                          <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span>{d.donorName || d.contributor.name}</span>
                        {flatNo && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            Flat {flatNo}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200/70">
                          {d.festival || 'Ganesh Festival'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                          {d.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <span className="text-lg font-black text-emerald-600">
                      +{formatCurrency(d.amount)}
                    </span>
                  </div>

                  {d.notes && <p className="text-xs text-gray-500 italic">{d.notes}</p>}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="text-gray-500">
                      {formatDate(d.receivedDate)} • Received by:{' '}
                      <span className="font-bold text-gray-800">{d.receivedByUser.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {d.attachments?.length > 0 && (
                        <button
                          onClick={() => setLightboxAttachment(d.attachments[0])}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          View Attachment
                        </button>
                      )}

                      {isAuthenticated && (
                        <button
                          onClick={() => setDeleteItem(d)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete deposit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Festival</th>
                  <th className="px-5 py-3.5">Donor / Contributor</th>
                  <th className="px-5 py-3.5">Flat / Source</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Received By</th>
                  <th className="px-5 py-3.5">Attachment</th>
                  {isAuthenticated && <th className="px-5 py-3.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deposits.map((d) => {
                  const flatNo = d.contributor.flat?.altName || d.contributor.flat?.displayName?.replace('-', '');
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap font-medium text-xs">
                        {formatDate(d.receivedDate)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-900 border border-rose-200">
                          {d.festival || 'Ganesh Festival'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {d.donorName || d.contributor.name}
                        {d.notes && <p className="text-xs text-gray-400 font-normal italic">{d.notes}</p>}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                        {flatNo ? `Flat ${flatNo}` : d.contributor.name}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          {d.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-black text-emerald-700 whitespace-nowrap">
                        +{formatCurrency(d.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-gray-800 whitespace-nowrap">
                        {d.receivedByUser.name}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {d.attachments?.length > 0 ? (
                          <button
                            onClick={() => setLightboxAttachment(d.attachments[0])}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200"
                          >
                            <Paperclip className="w-3 h-3" />
                            View Attachment
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      {isAuthenticated && (
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDeleteItem(d)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          title="Delete Deposit Record?"
          itemDetails={{
            party: deleteItem.donorName || deleteItem.contributor?.name,
            amount: deleteItem.amount,
            date: formatDate(deleteItem.receivedDate),
            description: `${deleteItem.paymentMethod} Payment`,
          }}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteItem(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}