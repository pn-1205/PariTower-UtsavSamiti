'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate, formatTime, downloadCsv } from '@/lib/utils';
import { getCached } from '@/lib/clientCache';
import {
  DollarSign,
  Search,
  PlusCircle,
  Paperclip,
  Trash2,
  Building2,
  User,
  FileSpreadsheet,
  FileText,
  FileCode,
  Share2,
  CheckCircle2,
  Clock,
  Check,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import TopFestivalSelector from '@/components/TopFestivalSelector';
import ShareFlatLinkModal from '@/components/ShareFlatLinkModal';
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
  const [pendingCount, setPendingCount] = useState(0);

  // Top Filter Selectors
  const [selectedFy, setSelectedFy] = useState<string>(getCurrentFinancialYear());
  const [selectedFestival, setSelectedFestival] = useState<string>('all');

  // Verification Status Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'VERIFIED' | 'PENDING_VERIFICATION'>('all');

  // Filters
  const [methodFilter, setMethodFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFestival !== 'all') params.set('festival', selectedFestival);
      if (selectedFy !== 'all') params.set('fy', selectedFy);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (methodFilter !== 'all') params.set('method', methodFilter);
      if (sourceFilter !== 'all') params.set('type', sourceFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/deposits?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDeposits(json.deposits || []);
        setPendingCount(json.pendingCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [selectedFestival, selectedFy, statusFilter, methodFilter, sourceFilter, searchQuery, refreshTrigger]);

  const totalAmount = deposits
    .filter((d) => d.status === 'VERIFIED')
    .reduce((acc, d) => acc + (d.amount || 0), 0);

  const handleApprove = async (id: string) => {
    try {
      setApprovingId(id);
      const res = await fetch(`/api/deposits/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        triggerRefresh();
        fetchDeposits();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to approve deposit');
      }
    } catch (e) {
      console.error(e);
      alert('Network error approving deposit');
    } finally {
      setApprovingId(null);
    }
  };

  const handleExportPdf = async () => {
    const { exportDepositsToPdf } = await import('@/lib/exportLedger');
    exportDepositsToPdf(deposits, totalAmount);
  };

  const handleExportExcel = async () => {
    const { exportDepositsToExcel } = await import('@/lib/exportLedger');
    exportDepositsToExcel(deposits, totalAmount);
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Status', 'Donor Name', 'Flat / Source', 'Amount (INR)', 'Payment Method', 'UTR Number', 'Account', 'Received By', 'Notes'];
    const rows = deposits.map((d) => [
      formatDate(d.receivedDate),
      d.status,
      `"${d.donorName || d.contributor.name}"`,
      `"${d.contributor.flat?.altName ? `Flat ${d.contributor.flat.altName}` : d.contributor.name}"`,
      d.amount,
      d.paymentMethod,
      `"${d.utrNumber || ''}"`,
      `"${d.paymentAccount?.name || ''}"`,
      `"${d.receivedByUser?.name || 'Awaiting Verification'}"`,
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
            Records of contributions received from flats and sponsors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Flat Link Button */}
          <button
            onClick={() => setShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95"
            title="Generate personalized link and QR code for WhatsApp sharing"
          >
            <Share2 className="w-4 h-4" />
            Share Flat Link
          </button>

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

      {/* Verification Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          All Records
        </button>
        <button
          onClick={() => setStatusFilter('VERIFIED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'VERIFIED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified Deposits
        </button>
        <button
          onClick={() => setStatusFilter('PENDING_VERIFICATION')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            statusFilter === 'PENDING_VERIFICATION'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Verification
          {pendingCount > 0 && (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                statusFilter === 'PENDING_VERIFICATION'
                  ? 'bg-white text-amber-700'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>

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
              const isPending = d.status === 'PENDING_VERIFICATION';

              return (
                <div
                  key={d.id}
                  className={`bg-white p-4 rounded-2xl border shadow-sm space-y-2.5 transition-all ${
                    isPending
                      ? 'border-amber-300 bg-gradient-to-br from-amber-50/50 via-white to-white ring-1 ring-amber-300/60'
                      : 'border-gray-200'
                  }`}
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

                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {isPending ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Approval
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        )}

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200/70">
                          {d.festival || 'Ganesh Festival'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {d.paymentMethod}
                        </span>
                        {d.paymentAccount && (
                          <span className="text-[10px] font-medium px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                            {d.paymentAccount.name}
                          </span>
                        )}
                        {formatTime(d.receivedDate) && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            ⏰ {formatTime(d.receivedDate)}
                          </span>
                        )}
                      </div>

                      {d.utrNumber && (
                        <div className="mt-1 text-[11px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded inline-block">
                          UTR: <strong className="text-stone-900">{d.utrNumber}</strong>
                        </div>
                      )}
                    </div>

                    <span className="text-lg font-black text-emerald-600">
                      +{formatCurrency(d.amount)}
                    </span>
                  </div>

                  {d.notes && <p className="text-xs text-gray-500 italic">{d.notes}</p>}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <div className="text-gray-500">
                      {formatDate(d.receivedDate)} {formatTime(d.receivedDate) ? `at ${formatTime(d.receivedDate)}` : ''} •{' '}
                      {isPending ? (
                        <span className="text-amber-700 font-medium">Awaiting Committee Approval</span>
                      ) : (
                        <span>
                          Verified by: <strong className="text-gray-800">{d.receivedByUser?.name || 'Admin'}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && isAuthenticated && (
                        <button
                          onClick={() => handleApprove(d.id)}
                          disabled={approvingId === d.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {approvingId === d.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}

                      {d.attachments?.length > 0 && (
                        <button
                          onClick={() => setLightboxAttachment(d.attachments[0])}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          View
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
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Festival</th>
                  <th className="px-5 py-3.5">Donor / Contributor</th>
                  <th className="px-5 py-3.5">Flat / Source</th>
                  <th className="px-5 py-3.5">Method & Account</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Verified / Received By</th>
                  <th className="px-5 py-3.5">Attachment</th>
                  {isAuthenticated && <th className="px-5 py-3.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deposits.map((d) => {
                  const flatNo = d.contributor.flat?.altName || d.contributor.flat?.displayName?.replace('-', '');
                  const isPending = d.status === 'PENDING_VERIFICATION';

                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        isPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap font-medium text-xs">
                        <div className="font-bold text-gray-900">{formatDate(d.receivedDate)}</div>
                        {formatTime(d.receivedDate) && (
                          <div className="text-[11px] font-mono text-purple-700 font-bold mt-0.5">
                            ⏰ {formatTime(d.receivedDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-900 border border-rose-200">
                          {d.festival || 'Ganesh Festival'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        <div>{d.donorName || d.contributor.name}</div>
                        {d.utrNumber && (
                          <div className="text-[11px] font-mono text-stone-500">
                            UTR: <span className="font-semibold text-stone-800">{d.utrNumber}</span>
                          </div>
                        )}
                        {d.notes && <p className="text-xs text-gray-400 font-normal italic">{d.notes}</p>}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-gray-700">
                        {flatNo ? `Flat ${flatNo}` : d.contributor.name}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                        <span className="inline-block px-2 py-0.5 font-semibold rounded bg-gray-100 text-gray-800 mr-1.5">
                          {d.paymentMethod}
                        </span>
                        {d.paymentAccount && (
                          <span className="inline-block px-2 py-0.5 font-medium rounded bg-purple-50 text-purple-700 border border-purple-200">
                            {d.paymentAccount.name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-black text-emerald-700 whitespace-nowrap">
                        +{formatCurrency(d.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold whitespace-nowrap">
                        {d.receivedByUser?.name ? (
                          <span className="text-gray-800">{d.receivedByUser?.name}</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Awaiting Verification</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {d.attachments?.length > 0 ? (
                          <button
                            onClick={() => setLightboxAttachment(d.attachments[0])}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200"
                          >
                            <Paperclip className="w-3 h-3" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      {isAuthenticated && (
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {isPending && (
                            <button
                              onClick={() => handleApprove(d.id)}
                              disabled={approvingId === d.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 mr-2"
                              title="Approve this online deposit into General Ledger"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {approvingId === d.id ? 'Approving...' : 'Approve'}
                            </button>
                          )}
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

      {/* Share Flat Payment Link & QR Modal */}
      <ShareFlatLinkModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        defaultFestival={selectedFestival !== 'all' ? selectedFestival : 'Ganesh Festival'}
      />
    </div>
  );
}