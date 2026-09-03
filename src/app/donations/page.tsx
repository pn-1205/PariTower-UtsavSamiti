'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatDate, downloadCsv } from '@/lib/utils';
import {
  Gift,
  Search,
  Download,
  PlusCircle,
  Paperclip,
  Trash2,
  Info,
  Building2,
  User,
} from 'lucide-react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

export default function DonationsPage() {
  const {
    user,
    isAuthenticated,
    setAddDonationModalOpen,
    setLightboxAttachment,
    refreshTrigger,
    triggerRefresh,
  } = useAuth();

  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/donations?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDonations(json.donations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [typeFilter, searchQuery, refreshTrigger]);

  const handleExportCsv = () => {
    const headers = ['Date', 'Contributor', 'Type', 'Item Name', 'Quantity', 'Unit', 'Estimated Value', 'Received By', 'Description'];
    const rows = donations.map((d) => [
      formatDate(d.donationDate),
      `"${d.contributor.name}"`,
      d.donationType,
      `"${d.itemName}"`,
      d.quantity,
      d.unit,
      d.estimatedValue || 0,
      `"${d.receivedByUser.name}"`,
      `"${(d.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv('ptfc_inkind_donations.csv', csvContent);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/donations/${deleteItem.id}`, {
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
            <Gift className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">In-Kind Donations</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Food grains, groceries, flowers, and puja offerings contributed by residents and guests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={donations.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-600" />
            Export CSV
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setAddDonationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              + Add Donation
            </button>
          )}
        </div>
      </div>

      {/* Accounting Rule Alert */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Accounting Rule Notice:</p>
          <p className="mt-0.5 text-amber-900 leading-relaxed">
            Food and non-money in-kind donations qualify flats as contributed, but their estimated values are strictly <strong>excluded</strong> from the committee's monetary cash balance.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by item name (e.g. Rice), contributor, receiver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4 flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              typeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            All ({donations.length})
          </button>
          <button
            onClick={() => setTypeFilter('Food')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              typeFilter === 'Food' ? 'bg-white text-amber-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Food
          </button>
          <button
            onClick={() => setTypeFilter('Other')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              typeFilter === 'Other' ? 'bg-white text-amber-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Other
          </button>
        </div>
      </div>

      {/* Responsive Cards / Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-bold">No in-kind donations found.</p>
          <p className="text-xs text-gray-400 mt-1">Record food groceries or supplies.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {donations.map((d) => (
              <div
                key={d.id}
                className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {d.donationType} Donation
                    </span>
                    <h4 className="font-black text-base text-gray-900 mt-1">
                      {d.quantity} {d.unit} {d.itemName}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1 font-semibold">
                      {d.contributor.contributorType === 'flat' ? (
                        <Building2 className="w-3.5 h-3.5 text-orange-600" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      {d.contributor.name}
                    </p>
                  </div>

                  {d.estimatedValue && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block font-medium">Est. Value</span>
                      <span className="text-xs font-bold text-gray-700">₹{d.estimatedValue}</span>
                    </div>
                  )}
                </div>

                {d.description && <p className="text-xs text-gray-500 italic">{d.description}</p>}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="text-gray-500">
                    {formatDate(d.donationDate)} • Received by:{' '}
                    <span className="font-bold text-gray-800">{d.receivedByUser.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {d.attachments?.length > 0 && (
                      <button
                        onClick={() => setLightboxAttachment(d.attachments[0])}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> View Attachment Attachment</button>
                    )}

                    {isAuthenticated && (
                      <button
                        onClick={() => setDeleteItem(d)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Contributor</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Item & Quantity</th>
                  <th className="px-5 py-3.5">Est. Value</th>
                  <th className="px-5 py-3.5">Received By</th>
                  <th className="px-5 py-3.5">Attachment</th>
                  {isAuthenticated && <th className="px-5 py-3.5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap font-medium text-xs">
                      {formatDate(d.donationDate)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                      {d.contributor.name}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                        {d.donationType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      <span className="font-bold">
                        {d.quantity} {d.unit}
                      </span>{' '}
                      {d.itemName}
                      {d.description && <p className="text-xs text-gray-400 italic">{d.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {d.estimatedValue ? `₹${d.estimatedValue.toLocaleString('en-IN')}` : '-'}
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
                          <Paperclip className="w-3 h-3" /> View Attachment
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

      {/* Delete Modal */}
      {deleteItem && (
        <DeleteConfirmDialog
          open={!!deleteItem}
          title="Delete In-Kind Donation?"
          itemDetails={{
            party: deleteItem.contributor?.name,
            date: formatDate(deleteItem.donationDate),
            description: `${deleteItem.quantity} ${deleteItem.unit} ${deleteItem.itemName}`,
          }}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteItem(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}