'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { PAYMENT_METHODS, CONTRIBUTOR_CATEGORIES } from '@/lib/utils';
import { X, Camera, Upload, Trash2, AlertCircle, Building2, User, Sparkles, Check } from 'lucide-react';

export default function AddDepositModal() {
  const { addDepositModalOpen, setAddDepositModalOpen, user, triggerRefresh } = useAuth();

  const [fromType, setFromType] = useState<'flat' | 'other'>('flat');
  const [festival, setFestival] = useState<string>('General Utsav Fund');
  const [flats, setFlats] = useState<any[]>([]);
  const [flatNumberInput, setFlatNumberInput] = useState('');
  const [otherContributors, setOtherContributors] = useState<any[]>([]);

  // Compulsory Donor Name
  const [donorName, setDonorName] = useState('');

  // Dynamic external contributor fields
  const [contributorNameInput, setContributorNameInput] = useState('');
  const [contributorCategory, setContributorCategory] = useState('Guest');
  const [contributorPhone, setContributorPhone] = useState('');

  // Transaction fields
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');

  // Attachment
  const [attachment, setAttachment] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addDepositModalOpen) {
      fetchFlatsAndContributors();
    }
  }, [addDepositModalOpen]);

  const fetchFlatsAndContributors = async () => {
    try {
      const [flatsRes, contribRes, accRes] = await Promise.all([
        fetch('/api/flats'),
        fetch('/api/contributors?type=other'),
        fetch('/api/payment-accounts'),
      ]);
      if (flatsRes.ok) {
        const d = await flatsRes.json();
        setFlats(d.flats || []);
      }
      if (contribRes.ok) {
        const cd = await contribRes.json();
        setOtherContributors(cd.contributors || []);
      }
      if (accRes && accRes.ok) {
        const ad = await accRes.json();
        if (ad.accounts) {
          setAccounts(ad.accounts);
          const def = ad.accounts.find((a: any) => a.isDefault) || ad.accounts[0];
          if (def) setPaymentAccountId(def.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cleanNum = (str: string) => str.replace(/[^0-9]/g, '');

  const matchedFlat = flats.find((f) => {
    const entered = cleanNum(flatNumberInput);
    if (!entered) return false;
    const fAlt = f.altName ? cleanNum(f.altName) : '';
    const fDisp = f.displayName ? cleanNum(f.displayName) : '';
    return fAlt === entered || fDisp === entered;
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
      } else {
        setAttachment(data.attachment);
      }
    } catch (e) {
      setUploadError('Network error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const matchedExistingContributor = otherContributors.find(
    (c) => c.name.toLowerCase().trim() === contributorNameInput.toLowerCase().trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!donorName.trim()) {
      setError('Name of the Donor is compulsory.');
      return;
    }

    let finalContributorId = '';
    let finalContributorName = '';

    if (fromType === 'flat') {
      if (!matchedFlat) {
        setError('Please enter a valid flat number (e.g. 101, 808, 1419).');
        return;
      }
      try {
        const res = await fetch(`/api/flats/${matchedFlat.id}`);
        const data = await res.json();
        finalContributorId = data.flat.contributorId;
      } catch (err) {
        setError('Failed to resolve flat contributor.');
        return;
      }
    } else {
      if (!contributorNameInput.trim()) {
        setError('Please enter contributor / party name.');
        return;
      }
      if (matchedExistingContributor) {
        finalContributorId = matchedExistingContributor.id;
      } else {
        finalContributorName = contributorNameInput.trim();
      }
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festival,
          contributorId: finalContributorId || undefined,
          contributorName: finalContributorName || undefined,
          contributorCategory,
          contributorPhone: contributorPhone?.trim() || undefined,
          donorName: donorName.trim(),
          amount: parseFloat(amount),
          paymentMethod,
          paymentAccountId: paymentAccountId || null,
          receivedDate,
          notes,
          attachment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save deposit.');
      } else {
        triggerRefresh();
        setAddDepositModalOpen(false);
        // Reset form
        setFlatNumberInput('');
        setDonorName('');
        setAmount('');
        setNotes('');
        setAttachment(null);
        setContributorNameInput('');
        setContributorPhone('');
      }
    } catch (err) {
      setError('Failed to submit deposit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!addDepositModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
              <span className="p-1 bg-white/10 rounded">₹</span>
              Record Money Received
            </h3>
            <p className="text-xs text-emerald-100">Add deposit from Flat or External Contributor</p>
          </div>
          <button
            onClick={() => setAddDepositModalOpen(false)}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Received From Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Received From
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFromType('flat')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  fromType === 'flat'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Flat Resident
              </button>
              <button
                type="button"
                onClick={() => setFromType('other')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  fromType === 'other'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                Other Contributor
              </button>
            </div>
          </div>

          {/* Flat Selection: Pure Number Input with Fixed 'Flat No. - ' Prefix & Suggestions */}
          {fromType === 'flat' ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Flat Number * (Type number e.g. 808, 101, 1419)
              </label>

              <div className="flex items-center rounded-xl border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 shadow-sm">
                <span className="bg-gray-100 text-gray-700 font-bold px-3.5 py-2.5 text-sm border-r border-gray-300 select-none whitespace-nowrap">
                  Flat No. -
                </span>
                <input
                  type="text"
                  list="flat-numbers-datalist"
                  placeholder="e.g. 808"
                  value={flatNumberInput}
                  onChange={(e) => setFlatNumberInput(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-base font-bold text-gray-900 focus:outline-none"
                />
              </div>

              {/* Suggestions strictly showing only numbers: 101, 102... (NO owner names) */}
              <datalist id="flat-numbers-datalist">
                {flats.map((f) => {
                  const numOnly = f.altName || f.displayName.replace('-', '');
                  return <option key={f.id} value={numOnly} />;
                })}
              </datalist>

              {matchedFlat ? (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>Valid Flat: {matchedFlat.altName || matchedFlat.displayName.replace('-', '')} (Floor {matchedFlat.floor})</span>
                </div>
              ) : flatNumberInput.trim() ? (
                <div className="mt-1.5 text-xs text-amber-700 font-medium">
                  Type a regular flat number (101 to 1419).
                </div>
              ) : null}
            </div>
          ) : (
            /* Dynamic External Contributor Input */
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Contributor / Organization Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="external-contributors-list"
                    placeholder="e.g. Rajesh Kumar or type any new name..."
                    value={contributorNameInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContributorNameInput(val);
                      if (!donorName) setDonorName(val);
                      const matched = otherContributors.find(
                        (c) => c.name.toLowerCase().trim() === val.toLowerCase().trim()
                      );
                      if (matched) {
                        setContributorCategory(matched.category || 'Guest');
                        if (matched.phone) setContributorPhone(matched.phone);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  />
                  <datalist id="external-contributors-list">
                    {otherContributors.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.category ? `(${c.category})` : ''}
                      </option>
                    ))}
                  </datalist>
                </div>

                {contributorNameInput.trim() && (
                  <div className="mt-1.5 text-[11px] flex items-center gap-1.5 font-medium">
                    {matchedExistingContributor ? (
                      <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        ✓ Selected existing contributor: {matchedExistingContributor.name}
                      </span>
                    ) : (
                      <span className="text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> New contributor will be added to the list
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={contributorCategory}
                    onChange={(e) => setContributorCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    {CONTRIBUTOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9822012345"
                    value={contributorPhone}
                    onChange={(e) => setContributorPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMPULSORY DONOR NAME FIELD */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
              Name of the Donor * (Compulsory)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kulkarni / Sunita Kulkarni"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-semibold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white shadow-sm"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Enter individual donor or family member name. Supports multiple entries from the same flat with different donors.
            </p>
          </div>

          {/* Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Amount (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-gray-500 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  placeholder="2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 text-base font-bold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deposited Into Account */}
          {accounts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Deposited Into Account *
              </label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountType === 'UPI_BANK' ? acc.upiId : 'Cash in Hand'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Received Date *
            </label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Attach Receipt / UPI Screenshot (Optional)
            </label>

            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            {attachment ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {attachment.fileType?.includes('image') ? (
                    <img
                      src={attachment.filePath}
                      alt="preview"
                      className="w-12 h-12 object-cover rounded-lg border border-emerald-300"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center font-bold text-emerald-800 text-xs">
                      PDF
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-emerald-900 truncate">{attachment.fileName}</p>
                    <p className="text-[11px] text-emerald-700">
                      {Math.round(attachment.fileSize / 1024)} KB • Attached
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="py-2.5 px-3 border border-dashed border-gray-300 hover:border-emerald-500 rounded-xl text-xs font-semibold text-gray-700 hover:text-emerald-700 bg-gray-50/50 hover:bg-emerald-50/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="py-2.5 px-3 border border-dashed border-gray-300 hover:border-emerald-500 rounded-xl text-xs font-semibold text-gray-700 hover:text-emerald-700 bg-gray-50/50 hover:bg-emerald-50/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Choose File / Gallery
                </button>
              </div>
            )}
            {uploading && <p className="text-xs text-emerald-600 mt-1">Uploading attachment...</p>}
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. UPI transaction ID, cheque number, remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Automatic Received By Display */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium">Received By:</span>
            <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {user?.name} (Logged in)
            </span>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddDepositModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}