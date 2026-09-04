'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CreditCard,
  Plus,
  Check,
  Trash2,
  Sparkles,
  Smartphone,
  Banknote,
  AlertCircle,
  Building,
} from 'lucide-react';
import CustomSelect from './ui/CustomSelect';
import { formatCurrency } from '@/lib/utils';

interface ManagePaymentAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdated?: () => void;
}

export default function ManagePaymentAccountsModal({
  isOpen,
  onClose,
  onAccountsUpdated,
}: ManagePaymentAccountsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // New account form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [accountType, setAccountType] = useState<'UPI_BANK' | 'CASH_IN_HAND'>('UPI_BANK');
  const [upiId, setUpiId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payment-accounts');
      if (res.ok) {
        const d = await res.json();
        setAccounts(d.accounts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      setShowAddForm(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/payment-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        fetchAccounts();
        if (onAccountsUpdated) onAccountsUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this account?')) return;
    try {
      const res = await fetch(`/api/payment-accounts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAccounts();
        if (onAccountsUpdated) onAccountsUpdated();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to deactivate account.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Holder name is required.');
      return;
    }

    if (accountType === 'UPI_BANK' && !upiId.trim()) {
      setError('UPI ID is required for UPI/Bank accounts.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payment-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          accountType,
          upiId: upiId.trim() || null,
          phone: phone.trim() || null,
          bankName: bankName.trim() || null,
          isDefault,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to create account.');
      } else {
        setName('');
        setUpiId('');
        setPhone('');
        setBankName('');
        setIsDefault(false);
        setShowAddForm(false);
        fetchAccounts();
        if (onAccountsUpdated) onAccountsUpdated();
      }
    } catch (err: any) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-in fade-in-0 duration-150">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Manage Receiving Accounts & Custodians</h3>
              <p className="text-[11px] text-amber-300">
                Configure committee members personal UPI accounts and track held balances.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Row: Add Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Configured Accounts ({accounts.length})
            </span>

            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-amber-300 text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Account
              </button>
            )}
          </div>

          {/* Add Account Form */}
          {showAddForm && (
            <form onSubmit={handleCreateAccount} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="text-xs font-black text-stone-900">Add Receiving Account / Custodian</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Holder Name & Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma (Treasurer)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Account Type *
                  </label>
                  <CustomSelect
                    value={accountType}
                    onChange={(val: any) => setAccountType(val)}
                    options={[
                      { value: 'UPI_BANK', label: 'UPI / Personal Bank Account' },
                      { value: 'CASH_IN_HAND', label: 'Cash in Hand (Samiti Cash)' },
                    ]}
                    theme="maroon"
                    size="sm"
                  />
                </div>

                {accountType === 'UPI_BANK' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                        UPI ID / VPA *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. rahul@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                        Bank Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-4 h-4 text-rose-900 rounded focus:ring-rose-800"
                    />
                    <span className="text-xs font-bold text-stone-800">Set as Default Receiving Account</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          )}

          {/* Accounts List */}
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-stone-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {acc.accountType === 'UPI_BANK' ? (
                      <Smartphone className="w-4 h-4 text-rose-800 shrink-0" />
                    ) : (
                      <Banknote className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    <span className="text-sm font-extrabold text-stone-900">{acc.name}</span>

                    {acc.isDefault && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full border border-amber-300">
                        Default
                      </span>
                    )}

                    <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold rounded-full">
                      {acc.accountType === 'UPI_BANK' ? 'UPI Bank' : 'Cash'}
                    </span>
                  </div>

                  {acc.upiId && (
                    <div className="text-xs font-mono text-stone-500 font-semibold">
                      UPI: <span className="text-rose-900">{acc.upiId}</span> {acc.bankName ? `(${acc.bankName})` : ''}
                    </div>
                  )}

                  {/* Financial Balances for this custodian */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-stone-600">
                    <span>
                      Inflow: <strong className="text-emerald-700 font-bold">{formatCurrency(acc.totalInflow || 0)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Outflow: <strong className="text-rose-700 font-bold">{formatCurrency(acc.totalOutflow || 0)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Held Balance: <strong className="text-stone-950 font-black">{formatCurrency(acc.currentBalance || 0)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!acc.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(acc.id)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors"
                    >
                      Make Default
                    </button>
                  )}

                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(acc.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Deactivate account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}