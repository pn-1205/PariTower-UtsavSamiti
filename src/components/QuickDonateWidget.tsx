'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sparkles,
  Smartphone,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  Download,
  Share2,
} from 'lucide-react';
import { DEFAULT_FESTIVALS } from '@/lib/festivalUtils';
import { formatCurrency } from '@/lib/utils';

export default function QuickDonateWidget() {
  const searchParams = useSearchParams();

  // URL parameters for Option 2 (pre-filled flat & festival)
  const initialFlat = searchParams.get('flat') || '';
  const initialFest = searchParams.get('fest') || '';
  const initialAcc = searchParams.get('acc') || '';

  const [festivals, setFestivals] = useState<string[]>(DEFAULT_FESTIVALS);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);

  // Form states
  const [selectedFestival, setSelectedFestival] = useState<string>(initialFest || 'Ganesh Festival');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [donorType, setDonorType] = useState<'flat' | 'other'>('flat');
  const [flatNumberInput, setFlatNumberInput] = useState<string>(initialFlat);
  const [selectedFlatId, setSelectedFlatId] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('501');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI flow states
  const [copied, setCopied] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [showQrOnMobile, setShowQrOnMobile] = useState<boolean>(false);

  // Quick amount preset chips
  const PRESET_AMOUNTS = ['251', '501', '1100', '2100', '5100'];

  // 1. Fetch festivals, accounts, and flats
  useEffect(() => {
    async function loadData() {
      try {
        const [festRes, accRes, flatsRes] = await Promise.all([
          fetch('/api/festivals'),
          fetch('/api/payment-accounts'),
          fetch('/api/flats'),
        ]);

        if (festRes.ok) {
          const fData = await festRes.json();
          if (fData.festivals) {
            setFestivals(Array.from(new Set([...DEFAULT_FESTIVALS, ...fData.festivals])));
          }
        }

        if (accRes.ok) {
          const aData = await accRes.json();
          if (aData.accounts && aData.accounts.length > 0) {
            setAccounts(aData.accounts);
            // Default selected account
            if (initialAcc) {
              const matched = aData.accounts.find((a: any) => a.id === initialAcc);
              if (matched) setSelectedAccountId(matched.id);
              else setSelectedAccountId(aData.accounts[0].id);
            } else {
              const def = aData.accounts.find((a: any) => a.isDefault) || aData.accounts[0];
              setSelectedAccountId(def.id);
            }
          }
        }

        if (flatsRes.ok) {
          const flData = await flatsRes.json();
          if (flData.flats) {
            setFlats(flData.flats);
            if (initialFlat) {
              const cleanInitial = initialFlat.replace(/[^0-9]/g, '');
              const matchedFlat = flData.flats.find(
                (f: any) => f.altName === cleanInitial || f.displayName?.replace('-', '') === cleanInitial
              );
              if (matchedFlat) {
                setSelectedFlatId(matchedFlat.id);
                setFlatNumberInput(matchedFlat.altName || matchedFlat.displayName);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed loading donation widget data:', err);
      }
    }

    loadData();
  }, [initialFlat, initialFest, initialAcc]);

  // Handle flat input search
  const handleFlatInputChange = (val: string) => {
    setFlatNumberInput(val);
    const clean = val.replace(/[^0-9]/g, '');
    const found = flats.find(
      (f) => f.altName === clean || f.displayName?.replace('-', '') === clean
    );
    if (found) {
      setSelectedFlatId(found.id);
    } else {
      setSelectedFlatId('');
    }
  };

  // Selected payment account object
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0] || {
    name: 'Pari Tower Samiti Treasurer',
    upiId: 'pariutsav@upi',
  };

  const finalAmount = amount === 'custom' ? parseFloat(customAmount) || 0 : parseFloat(amount) || 0;

  // Build standard NPCI UPI URI
  const upiPayee = activeAccount.upiId || 'pariutsav@upi';
  const upiName = activeAccount.name || 'Pari Tower Utsav Samiti';
  const upiNote = `${selectedFestival} - ${donorName || (flatNumberInput ? `Flat ${flatNumberInput}` : 'Donation')}`;

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiPayee)}&pn=${encodeURIComponent(upiName)}&am=${finalAmount > 0 ? finalAmount : ''}&cu=INR&tn=${encodeURIComponent(upiNote)}`;

  // Mobile App Intent deep links
  const gpayUri = `tez://upi/pay?pa=${encodeURIComponent(upiPayee)}&pn=${encodeURIComponent(upiName)}&am=${finalAmount > 0 ? finalAmount : ''}&cu=INR&tn=${encodeURIComponent(upiNote)}`;
  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(upiPayee)}&pn=${encodeURIComponent(upiName)}&am=${finalAmount > 0 ? finalAmount : ''}&cu=INR&tn=${encodeURIComponent(upiNote)}`;
  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(upiPayee)}&pn=${encodeURIComponent(upiName)}&am=${finalAmount > 0 ? finalAmount : ''}&cu=INR&tn=${encodeURIComponent(upiNote)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiPayee);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle 1-tap donation registration & payment trigger
  const handleProceedToPay = async (targetUri?: string) => {
    setError('');

    if (finalAmount <= 0) {
      setError('Please select or enter an amount greater than 0.');
      return;
    }

    if (!donorName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (donorType === 'flat' && !flatNumberInput.trim()) {
      setError('Please enter your flat number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: donorName.trim(),
          festival: selectedFestival,
          flatId: donorType === 'flat' ? selectedFlatId : null,
          contributorName: donorType === 'flat' ? null : donorName.trim(),
          contributorCategory: donorType === 'flat' ? 'Resident' : 'Well-wisher',
          paymentAccountId: activeAccount.id,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to record donation.');
      } else {
        setSuccessReceipt(data);
        // If a UPI deep link was passed, trigger app chooser on mobile!
        if (targetUri) {
          window.location.href = targetUri;
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="donate-section"
      className="bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-white rounded-3xl shadow-xl p-5 sm:p-7 border border-amber-500/30 relative overflow-hidden"
    >
      {/* Subtle sacred gold background glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-800/60 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[11px] font-extrabold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            Pari Tower Festival Contribution & Donation
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Pay Online via UPI & Instant Approval
          </h2>
          <p className="text-xs text-rose-200/90 mt-0.5">
            100% direct bank-to-bank contribution with 0% gateway commission.
          </p>
        </div>

        {/* Receiver Account Badge */}
        <div className="bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
            Official Receiving Account:
          </span>
          <span className="font-extrabold text-white text-sm">
            {activeAccount.name}
          </span>
          <span className="text-[11px] text-rose-200 block font-mono">
            {activeAccount.upiId || 'Direct UPI'}
          </span>
        </div>
      </div>

      {/* Success Modal / Acknowledgment */}
      {successReceipt ? (
        <div className="py-8 text-center space-y-4 animate-in fade-in-0 duration-200">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center mx-auto border border-emerald-400/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-amber-200">Payment Logged, {donorName}!</h3>
            <p className="text-sm text-rose-100 max-w-md mx-auto">
              Your contribution of <strong className="text-emerald-300">{formatCurrency(finalAmount)}</strong> for{' '}
              <strong className="text-amber-200">{selectedFestival}</strong> has been recorded!
            </p>
          </div>

          {/* Receipt Info Card */}
          <div className="bg-black/40 border border-amber-400/30 max-w-sm mx-auto p-4 rounded-2xl text-left text-xs space-y-2 font-mono text-rose-200">
            <div className="flex justify-between pb-1.5 border-b border-white/10">
              <span className="text-stone-400">Receipt No:</span>
              <span className="font-bold text-white">{successReceipt.receiptNo}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-white/10">
              <span className="text-stone-400">Contributor:</span>
              <span className="font-bold text-white">
                {donorName} {flatNumberInput ? `(Flat ${flatNumberInput})` : ''}
              </span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-white/10">
              <span className="text-stone-400">Time of Payment:</span>
              <span className="font-bold text-amber-300">
                {successReceipt.recordedTime || new Date().toLocaleTimeString('en-IN')}, {successReceipt.recordedDate || new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-white/10">
              <span className="text-stone-400">Paid To:</span>
              <span className="font-bold text-white">{activeAccount.name}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-stone-400">Status:</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full border border-amber-500/40 text-[10px]">
                Pending Committee Verification
              </span>
            </div>
          </div>

          <p className="text-[11px] text-rose-200/90 max-w-md mx-auto italic">
            No UTR number needed! The committee member will check their bank/UPI app statement for your Name, Amount, and Time of payment to verify it into the General Ledger.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccessReceipt(null);
                setDonorName('');
              }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
            >
              + Make Another Contribution
            </button>
          </div>
        </div>
      ) : (
        /* Main Interactive Donation Form */
        <div className="mt-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-950/80 text-red-200 rounded-xl border border-red-500/50 font-semibold">
              {error}
            </div>
          )}

          {/* Row 1: Festival & Receiving Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Festival Selector */}
            <div>
              <label className="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                Festival / Event *
              </label>
              <select
                value={selectedFestival}
                onChange={(e) => setSelectedFestival(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                {festivals.map((f) => (
                  <option key={f} value={f} className="text-stone-900">
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Receiving Account Picker */}
            <div>
              <label className="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                Payee Account (Receiver)
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="text-stone-900">
                    {acc.name} {acc.upiId ? `(${acc.upiId})` : ''} {acc.isDefault ? '• Default' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Donor Type, Flat & Donor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-black/20 p-3.5 rounded-2xl border border-white/10">
            {/* Donor Type */}
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-1">
                Contributor Type
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDonorType('flat')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    donorType === 'flat'
                      ? 'bg-amber-400 text-rose-950 shadow-sm'
                      : 'bg-white/10 text-stone-300 hover:bg-white/20'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  Resident
                </button>
                <button
                  type="button"
                  onClick={() => setDonorType('other')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    donorType === 'other'
                      ? 'bg-amber-400 text-rose-950 shadow-sm'
                      : 'bg-white/10 text-stone-300 hover:bg-white/20'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Guest
                </button>
              </div>
            </div>

            {/* Flat Selection (if Resident) */}
            {donorType === 'flat' && (
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-1">
                  Flat Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 808 or 1204"
                  value={flatNumberInput}
                  onChange={(e) => handleFlatInputChange(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            )}

            {/* Donor Full Name */}
            <div className={donorType === 'flat' ? 'sm:col-span-3' : 'sm:col-span-5'}>
              <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-1">
                Donor Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter full name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {/* WhatsApp / Phone */}
            <div className={donorType === 'flat' ? 'sm:col-span-3' : 'sm:col-span-4'}>
              <label className="block text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-1">
                WhatsApp Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Amount Selection Chips */}
          <div>
            <label className="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider mb-1.5">
              Select Amount (INR) *
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${
                    amount === preset
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-rose-950 shadow-md scale-105 ring-2 ring-amber-300'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setAmount('custom')}
                className={`text-xs font-black px-3.5 py-2 rounded-xl transition-all ${
                  amount === 'custom'
                    ? 'bg-amber-400 text-rose-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                Custom Amount
              </button>

              {amount === 'custom' && (
                <div className="relative flex-1 min-w-[120px]">
                  <span className="absolute left-3 top-2 text-xs font-bold text-amber-300">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-black bg-white/15 border border-amber-400/60 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Instant UPI App Payment & Dynamic QR */}
          <div className="bg-black/30 p-4 rounded-2xl border border-amber-400/30 flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Left: Mobile 1-Tap Buttons & UPI Copy */}
            <div className="space-y-2.5 w-full md:flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Instant Payment (Mobile UPI)
                </span>
                <span className="text-xs font-black text-amber-200">
                  Amount: {formatCurrency(finalAmount)}
                </span>
              </div>

              {/* Main Universal 1-Tap Intent Button */}
              <button
                type="button"
                onClick={() => handleProceedToPay(upiUri)}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-rose-950 font-black text-sm rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4" />
                {submitting ? 'Recording Transaction...' : 'Pay via UPI App (GPay / PhonePe / Paytm)'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* App-specific shortcuts */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleProceedToPay(gpayUri)}
                  disabled={submitting}
                  className="flex-1 text-center py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                >
                  🟢 Google Pay
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedToPay(phonepeUri)}
                  disabled={submitting}
                  className="flex-1 text-center py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                >
                  🟣 PhonePe
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedToPay(paytmUri)}
                  disabled={submitting}
                  className="flex-1 text-center py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50"
                >
                  🔵 Paytm
                </button>
              </div>

              {/* UPI ID copy box */}
              <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <div className="truncate pr-2">
                  <span className="text-stone-400 text-[10px] block">Receiving UPI ID:</span>
                  <span className="font-mono text-amber-200 font-bold">{upiPayee}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="md:hidden pt-1">
                <button
                  type="button"
                  onClick={() => setShowQrOnMobile(!showQrOnMobile)}
                  className="text-[11px] text-amber-300 underline font-semibold"
                >
                  {showQrOnMobile ? 'Hide QR Code' : 'Or view QR Code to scan'}
                </button>
              </div>
            </div>

            {/* Right: Dynamic QR Code (Always visible on desktop, toggle on mobile) */}
            <div
              className={`flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner border-2 border-amber-400 shrink-0 ${
                showQrOnMobile ? 'block' : 'hidden md:flex'
              }`}
            >
              <QRCodeSVG
                value={upiUri}
                size={140}
                level="M"
                includeMargin={false}
              />
              <span className="text-[10px] font-black text-rose-950 mt-1.5 uppercase tracking-wider">
                Scan with any UPI App
              </span>
              <button
                type="button"
                onClick={() => handleProceedToPay()}
                disabled={submitting}
                className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {submitting ? 'Recording...' : '✓ I Have Paid'}
              </button>
            </div>
          </div>

          <div className="bg-black/20 p-3 rounded-2xl border border-white/10 text-center">
            <p className="text-[11px] text-amber-200/90 font-medium">
              ⚡ <strong>No UTR submission needed!</strong> Clicking payment automatically logs your Name, Flat, Amount, and exact Timestamp. The committee matches this directly on their bank/UPI statement to approve your receipt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}