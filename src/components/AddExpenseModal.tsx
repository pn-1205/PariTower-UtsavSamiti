'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils';
import { X, Camera, Upload, Trash2, AlertCircle, TrendingDown } from 'lucide-react';
import { FESTIVAL_OPTIONS } from '@/lib/festivalUtils';

export default function AddExpenseModal() {
  const { addExpenseModalOpen, setAddExpenseModalOpen, user, triggerRefresh } = useAuth();

  const [festival, setFestival] = useState<string>('Ganesh Festival');
  const [expenseCategory, setExpenseCategory] = useState<string>('Food');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Attachment
  const [attachment, setAttachment] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    if (!paidTo.trim()) {
      setError('Paid To (Vendor/Payee) is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          festival,
          expenseCategory,
          description: description.trim(),
          amount: parseFloat(amount),
          paidTo: paidTo.trim(),
          paymentMethod,
          expenseDate,
          notes,
          attachment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to record expense.');
      } else {
        triggerRefresh();
        setAddExpenseModalOpen(false);
        // Reset form
        setDescription('');
        setAmount('');
        setPaidTo('');
        setNotes('');
        setAttachment(null);
      }
    } catch (err) {
      setError('Failed to record expense.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!addExpenseModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-rose-100 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-700 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Record Festival Expense
            </h3>
            <p className="text-xs text-rose-100">Money out for vendor, materials or services</p>
          </div>
          <button
            onClick={() => setAddExpenseModalOpen(false)}
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

          {/* Festival / Event Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Festival / Event *
            </label>
            <select
              value={festival}
              onChange={(e) => setFestival(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-semibold"
            >
              {FESTIVAL_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Expense Category *
            </label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <input
              type="text"
              placeholder="e.g. Flower decoration for main stage"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
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
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 text-base font-bold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid To & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Paid To (Vendor/Payee) *
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Decorations or Caterer"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Attachment (Mobile Camera & Gallery) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Attach Bill / Receipt / Invoice Photo
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
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {attachment.fileType?.includes('image') ? (
                    <img
                      src={attachment.filePath}
                      alt="preview"
                      className="w-12 h-12 object-cover rounded-lg border border-rose-300"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-rose-200 rounded-lg flex items-center justify-center font-bold text-rose-800 text-xs">
                      PDF
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-rose-900 truncate">{attachment.fileName}</p>
                    <p className="text-[11px] text-rose-700">
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
                  className="py-2.5 px-3 border border-dashed border-gray-300 hover:border-rose-500 rounded-xl text-xs font-semibold text-gray-700 hover:text-rose-700 bg-gray-50/50 hover:bg-rose-50/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4 text-rose-600" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="py-2.5 px-3 border border-dashed border-gray-300 hover:border-rose-500 rounded-xl text-xs font-semibold text-gray-700 hover:text-rose-700 bg-gray-50/50 hover:bg-rose-50/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-rose-600" />
                  Choose File / Gallery
                </button>
              </div>
            )}
            {uploading && <p className="text-xs text-rose-600 mt-1">Uploading receipt...</p>}
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Invoice #, warranty or vendor contact..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Automatic Entered By Display */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium">Entered By:</span>
            <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {user?.name} (Logged in)
            </span>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddExpenseModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}