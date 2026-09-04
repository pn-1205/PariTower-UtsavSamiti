'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, formatDate, CONTRIBUTOR_CATEGORIES } from '@/lib/utils';
import { User, Search, PlusCircle, Phone, Gift, CheckCircle2, Tag } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Contributor Categories' },
  ...CONTRIBUTOR_CATEGORIES.map((c) => ({ value: c, label: c })),
];

export default function ContributorsPage() {
  const { user, isAuthenticated, refreshTrigger, triggerRefresh } = useAuth();
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // New Contributor modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Guest');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchContributors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: 'other' });
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/contributors?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setContributors(json.contributors || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, [categoryFilter, searchQuery, refreshTrigger]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category, phone: phone.trim(), notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add contributor');
      } else {
        setModalOpen(false);
        setName('');
        setPhone('');
        setNotes('');
        triggerRefresh();
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-rose-900" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">External Contributors</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Non-flat donors including guests, commercial sponsors, and well-wishers.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 self-start sm:self-center"
          >
            <PlusCircle className="w-4 h-4" />
            + Add Contributor
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white/95 backdrop-blur-xs p-3 sm:p-3.5 rounded-2xl shadow-sm border border-stone-200/90 grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3 relative z-10">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search contributor name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 text-stone-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        <div className="sm:col-span-4">
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORY_OPTIONS}
            headerLabel="Filter By Category"
            icon={Tag}
          />
        </div>
      </div>

      {/* Grid of Contributors */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      ) : contributors.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-bold">No external contributors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {contributors.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{c.name}</h3>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-orange-800 rounded mt-1">
                      {c.category || 'External'}
                    </span>
                  </div>
                  {c.phone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {c.phone}
                    </span>
                  )}
                </div>

                {c.notes && <p className="text-xs text-gray-500 italic mt-2">{c.notes}</p>}

                <div className="my-3 p-3 bg-gray-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Money Contributed:</span>
                    <span className="font-black text-emerald-700">
                      {formatCurrency(c.totalMoney)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Food Donations:</span>
                    <span className="font-bold text-gray-800">{c.foodDonations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Other Donations:</span>
                    <span className="font-bold text-gray-800">{c.otherDonations}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-2">
                Last contribution: {formatDate(c.lastContribution)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contributor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-orange-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Add External Contributor</h3>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white"
                >
                  {CONTRIBUTOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 9822012345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sponsor from Sector 4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-sm text-white bg-slate-900 hover:bg-black font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Contributor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}