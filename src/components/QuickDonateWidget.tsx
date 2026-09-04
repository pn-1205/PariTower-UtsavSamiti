'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  AlertCircle,
  X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { triggerFestiveConfetti } from '@/components/ui/Confetti';

const DEFAULT_UPI_ACCOUNTS = [
  {
    id: 'acc_suryakant',
    name: 'Suryakant Dilip Sabale',
    upiId: '9921137881@icici',
    bankName: 'ICICI Bank',
    isDefault: true,
  },
  {
    id: 'acc_rajeshwar',
    name: 'Rajeshwar Dinkar Gawali',
    upiId: '9552051087@ptyes',
    bankName: 'Yes Bank',
    isDefault: false,
  },
];

export default function QuickDonateWidget() {
  const searchParams = useSearchParams();

  // URL parameters for Option 2 (pre-filled flat)
  const initialFlat = searchParams.get('flat') || '';
  const initialAcc = searchParams.get('acc') || '';

  const [accounts, setAccounts] = useState<any[]>(DEFAULT_UPI_ACCOUNTS);
  const [flats, setFlats] = useState<any[]>([]);

  // Form states - Randomize initial receiving custodian across available custodians
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    if (initialAcc) return initialAcc;
    const randomIdx = Math.floor(Math.random() * DEFAULT_UPI_ACCOUNTS.length);
    return DEFAULT_UPI_ACCOUNTS[randomIdx]?.id || 'acc_suryakant';
  });
  const [donorType, setDonorType] = useState<'flat' | 'other'>('flat');
  const [flatNumberInput, setFlatNumberInput] = useState<string>(initialFlat);
  const [selectedFlatId, setSelectedFlatId] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('351');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI flow states
  const [copied, setCopied] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [showQrOnMobile, setShowQrOnMobile] = useState<boolean>(false);
  const [appOpenHint, setAppOpenHint] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Approach 1: App Return Detection & Confirmation Modal States
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string>('');
  const [utrInput, setUtrInput] = useState<string>('');
  const awaitingReturnRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      setIsAndroid(/android/i.test(ua));
      setIsIOS(/iphone|ipad|ipod/i.test(ua));
    }

    // Tab return detection when returning from GPay / PhonePe
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && awaitingReturnRef.current) {
        awaitingReturnRef.current = false;
        setShowConfirmModal(true);
      }
    };

    const handleWindowFocus = () => {
      if (awaitingReturnRef.current) {
        awaitingReturnRef.current = false;
        setShowConfirmModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Quick amount preset chips (minimum 351, 501, 1100, 2100, 5100)
  const PRESET_AMOUNTS = ['351', '501', '1100', '2100', '5100'];

  // 1. Fetch festivals, accounts, and flats
  useEffect(() => {
    async function loadData() {
      try {
        const [accRes, flatsRes] = await Promise.all([
          fetch('/api/payment-accounts'),
          fetch('/api/flats'),
        ]);

        if (accRes.ok) {
          const aData = await accRes.json();
          if (aData.accounts && aData.accounts.length > 0) {
            // Filter strictly for active accounts with valid UPI IDs
            const upiAccounts = aData.accounts.filter(
              (a: any) => a.accountType === 'UPI_BANK' && a.upiId && a.isActive !== false
            );
            if (upiAccounts.length > 0) {
              setAccounts(upiAccounts);
              if (initialAcc) {
                const matched = upiAccounts.find((a: any) => a.id === initialAcc);
                if (matched) setSelectedAccountId(matched.id);
                else setSelectedAccountId(upiAccounts[0].id);
              } else {
                // Randomly balance initial custodian selection between accounts
                setSelectedAccountId((prev) => {
                  const exists = upiAccounts.find((a: any) => a.id === prev);
                  if (exists) return prev;
                  const randomIdx = Math.floor(Math.random() * upiAccounts.length);
                  return upiAccounts[randomIdx].id;
                });
              }
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
  }, [initialFlat, initialAcc]);

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
    id: 'acc_suryakant',
    name: 'Suryakant Dilip Sabale',
    upiId: '9921137881@icici',
  };

  const finalAmount = amount === 'custom' ? parseFloat(customAmount) || 0 : parseFloat(amount) || 0;

  // Compute effective donor name (auto-fill from flat if entered, default to Resident so payment is never blocked)
  const effectiveDonorName =
    donorName.trim() ||
    (donorType === 'flat' && flatNumberInput.trim() ? `Flat ${flatNumberInput.trim()}` : '') ||
    'Resident';

  // NPCI-compliant parameters
  const upiPayee = (activeAccount.upiId || '9921137881@icici').trim();
  const cleanName = (activeAccount.name || 'Pari Tower Samiti')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 50);

  const amtStr = finalAmount > 0 ? finalAmount.toFixed(2) : '351.00';
  const rawNote = effectiveDonorName ? `PTUS ${effectiveDonorName}` : 'PTUS General Contribution';
  const cleanNote = rawNote.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().slice(0, 30);

  // Preserve literal @ in VPA address so mobile apps (GPay, PhonePe, Paytm) parse correctly
  const queryParams = `pa=${upiPayee}&pn=${encodeURIComponent(cleanName)}&am=${amtStr}&cu=INR&tn=${encodeURIComponent(cleanNote || 'Contribution')}`;

  // Standard Universal UPI URI (triggers Android/iOS native app chooser: GPay, PhonePe, Paytm, etc.)
  const universalUpiUri = `upi://pay?${queryParams}`;

  // Direct P2P URI without locked amount (Fix for Google Pay blocking personal VPA web intents)
  const p2pUpiUri = `upi://pay?pa=${upiPayee}&pn=${encodeURIComponent(cleanName)}&cu=INR&tn=${encodeURIComponent(cleanNote || 'Contribution')}`;

  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(upiPayee);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Launch payment link and mark that user is switching to UPI app
  const handlePayClick = (e?: React.MouseEvent<HTMLElement>) => {
    if (e) e.preventDefault();
    setError('');

    if (finalAmount <= 0) {
      setError('Please select or enter an amount greater than ₹0.');
      return;
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

    // Auto-copy UPI ID to clipboard as a convenient fallback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(upiPayee);
      }
    } catch {
      // Ignore clipboard permission errors
    }

    if (!isMobile) {
      // On desktop, display the QR code and open confirmation
      setShowQrOnMobile(true);
      setShowConfirmModal(true);
      return;
    }

    // On mobile: set flag that we are waiting for user to return from Google Pay / UPI app
    awaitingReturnRef.current = true;

    // Trigger universal UPI intent link
    try {
      window.location.href = universalUpiUri;
    } catch (err) {
      console.warn('Could not launch universal UPI URI:', err);
    }

    // Fallback: in case visibility change doesn't trigger, show confirmation prompt after 2.5s
    setTimeout(() => {
      if (awaitingReturnRef.current && document.visibilityState === 'visible') {
        awaitingReturnRef.current = false;
        setShowConfirmModal(true);
      }
    }, 2500);
  };

  // Called when user confirms "Yes, I Have Completed Payment"
  const handleConfirmPayment = async () => {
    setConfirmError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: effectiveDonorName,
          festival: 'General Utsav Fund',
          flatId: donorType === 'flat' ? selectedFlatId : null,
          contributorName: donorType === 'flat' ? null : effectiveDonorName,
          contributorCategory: donorType === 'flat' ? 'Resident' : 'Well-wisher',
          paymentAccountId: activeAccount.id,
          utrNumber: utrInput.trim() || null,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessReceipt(data);
        setShowConfirmModal(false);
        triggerFestiveConfetti();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setConfirmError(errJson.error || 'Failed to record payment. Please try again.');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setConfirmError('Network error recording payment. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="donate-section"
      className="bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all p-3.5 sm:p-6 md:p-7 border border-stone-200/90 relative overflow-hidden ring-1 ring-stone-900/5"
    >
      {/* Magic UI Border Beam animated aura with subtle festive amber/gold */}
      <BorderBeam size={280} duration={14} borderWidth={1.5} colorFrom="#f59e0b" colorTo="#d97706" />

      {/* Subtle warm ambient glows */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-stone-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-stone-100 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
            <span>Pari Tower Festival Contribution</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-stone-900 flex items-center gap-2">
            Online Contribution via UPI
          </h2>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
            Direct bank-to-bank contribution • 0% gateway commission • Verified by Samiti
          </p>
        </div>
      </div>

      {/* Success Modal / Acknowledgment */}
      {successReceipt ? (
        <div className="py-8 text-center space-y-4 animate-in fade-in-0 duration-200">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-stone-900">Contribution Initiated!</h3>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              Your contribution of <strong className="text-emerald-700">{formatCurrency(finalAmount)}</strong> towards the{' '}
              <strong className="text-amber-800">Pari Tower Utsav Samiti</strong> has been logged.
            </p>
          </div>

          {/* Receipt Info Card */}
          <div className="bg-stone-50 border border-stone-200/90 w-full max-w-md mx-auto p-4 rounded-2xl text-left text-xs space-y-2 font-mono text-stone-700 shadow-xs">
            <div className="flex justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Reference No:</span>
              <span className="font-bold text-stone-900">{successReceipt.receiptNo || 'PTR-' + Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Contributor:</span>
              <span className="font-bold text-stone-900">
                {effectiveDonorName} {flatNumberInput ? `(Flat ${flatNumberInput})` : ''}
              </span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Amount:</span>
              <span className="font-bold text-emerald-700 text-sm">{formatCurrency(finalAmount)}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Date & Time:</span>
              <span className="font-bold text-stone-900">
                {new Date().toLocaleTimeString('en-IN')}, {new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Receiver Custodian:</span>
              <span className="font-bold text-stone-900">{activeAccount.name}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-stone-500">Status:</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded-full border border-amber-200 text-[10px]">
                Pending Committee Verification
              </span>
            </div>
          </div>

          {/* Payment Guidance & Options Card */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5 max-w-md mx-auto text-left space-y-3.5">
            <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-700" />
                Complete Your UPI Transfer
              </span>
              <span className="text-[10px] font-bold text-stone-500">
                Step 2 of 2
              </span>
            </div>

            {/* Option A: Copy UPI ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Option 1: Copy UPI ID (Best for Google Pay & PhonePe)
                </span>
                {copied && (
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-amber-200/90 shadow-2xs">
                <span className="font-mono text-xs font-bold text-stone-900 flex-1 truncate select-all">
                  {upiPayee}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                👉 If your UPI app shows <em>&quot;Cannot send money to this UPI address&quot;</em>, simply copy this ID, open <strong>Google Pay</strong> or <strong>PhonePe</strong>, click <strong>Pay UPI ID</strong>, paste and pay <strong>{formatCurrency(finalAmount)}</strong>.
              </p>
            </div>

            {/* Option B: Scan QR Code */}
            <div className="pt-2 border-t border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">
                  Option 2: Scan QR Code (Guaranteed to Work)
                </span>
                <button
                  type="button"
                  onClick={() => setShowQrOnMobile(!showQrOnMobile)}
                  className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  {showQrOnMobile ? 'Hide QR Code' : 'Show QR Code'}
                </button>
              </div>

              {showQrOnMobile && (
                <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2 animate-in fade-in-0 duration-150">
                  <QRCodeSVG value={universalUpiUri} size={150} level="M" />
                  <span className="text-[10px] font-extrabold text-stone-600 text-center">
                    Scan with any UPI scanner or take a screenshot and select from gallery
                  </span>
                </div>
              )}
            </div>

            {/* Option C: Direct App Links */}
            <div className="pt-2 border-t border-amber-200/70 space-y-2">
              <span className="text-xs font-bold text-stone-800 block">
                Option 3: Retry Opening UPI App Directly
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={universalUpiUri}
                  className="py-2 px-3 bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  Universal UPI
                </a>
                <a
                  href={p2pUpiUri}
                  className="py-2 px-3 bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <span>GPay / P2P App</span>
                </a>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-500 max-w-md mx-auto italic">
            No UTR submission needed! The committee matches your payment on their bank statement by Name, Amount, and Timestamp.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccessReceipt(null);
                setDonorName('');
                setShowQrOnMobile(false);
              }}
              className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              + Make Another Contribution
            </button>
          </div>
        </div>
      ) : (
        /* Main Interactive Donation Form */
        <div className="mt-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Receiving Account 2-Option Card Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-extrabold text-stone-700 uppercase tracking-wider">
                Select Receiving Custodian (Account) *
              </label>
              <span className="text-[10px] text-stone-400 font-semibold">Choose either committee custodian</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accounts.map((acc) => {
                const isSelected = activeAccount.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`relative text-left p-3 rounded-xl border transition-all duration-200 flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 text-stone-900 shadow-xs ring-1 ring-amber-500/20'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-stone-300 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black truncate text-stone-900">{acc.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold border flex-shrink-0 ${
                            isSelected
                              ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-700 font-mono font-bold tracking-tight truncate mt-0.5">
                        {acc.upiId}
                      </div>
                      {acc.bankName && (
                        <div className="text-[10px] text-stone-400 font-medium truncate mt-0.5">
                          {acc.bankName}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Donor Type, Flat & Donor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 bg-stone-50/80 p-3 sm:p-3.5 rounded-2xl border border-stone-200/80">
            {/* Donor Type */}
            <div className={donorType === 'flat' ? 'sm:col-span-1 lg:col-span-3' : 'sm:col-span-1 lg:col-span-4'}>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                Contributor Type
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDonorType('flat')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    donorType === 'flat'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
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
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Guest
                </button>
              </div>
            </div>

            {/* Flat Selection (if Resident) */}
            {donorType === 'flat' && (
              <div className="sm:col-span-1 lg:col-span-3">
                <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Flat Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 808 or 1204"
                  value={flatNumberInput}
                  onChange={(e) => handleFlatInputChange(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-stone-300 text-stone-900 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}

            {/* Donor Full Name */}
            <div className={donorType === 'flat' ? 'sm:col-span-1 lg:col-span-3' : 'sm:col-span-1 lg:col-span-4'}>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                Donor Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter full name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-stone-300 text-stone-900 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* WhatsApp / Phone */}
            <div className={donorType === 'flat' ? 'sm:col-span-1 lg:col-span-3' : 'sm:col-span-2 lg:col-span-4'}>
              <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                WhatsApp Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-stone-300 text-stone-900 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Amount Selection Chips */}
          <div>
            <label className="block text-[11px] font-extrabold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Amount (INR) *
            </label>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`text-xs font-black px-3.5 sm:px-4 py-2 rounded-xl transition-all ${
                    amount === preset
                      ? 'bg-stone-900 text-white shadow-xs scale-105 ring-2 ring-stone-900/10'
                      : 'bg-stone-100 hover:bg-stone-200/80 text-stone-800 border border-stone-200/80'
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
                    ? 'bg-stone-900 text-white shadow-xs ring-2 ring-stone-900/10'
                    : 'bg-stone-100 hover:bg-stone-200/80 text-stone-800 border border-stone-200/80'
                }`}
              >
                Custom Amount
              </button>

              {amount === 'custom' && (
                <div className="relative w-full sm:w-auto sm:flex-1 min-w-[140px] mt-1 sm:mt-0">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-500">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 text-xs font-black bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Single Universal 1-Tap UPI Action & Dynamic QR */}
          <div className="space-y-3 pt-1">
            {/* Direct 1-Tap Universal UPI Payment Button */}
            <button
              type="button"
              onClick={handlePayClick}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 sm:gap-2.5 py-3.5 sm:py-4 px-4 sm:px-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <Smartphone className="w-5 h-5 shrink-0" />
              <div className="text-center min-w-0">
                <div className="text-sm sm:text-base font-black tracking-tight truncate">
                  <span className="sm:hidden">
                    {submitting ? 'Recording...' : `Pay ${formatCurrency(finalAmount)} via UPI App`}
                  </span>
                  <span className="hidden sm:inline">
                    {submitting ? 'Recording...' : `Pay ${formatCurrency(finalAmount)} via UPI (Google Pay, PhonePe, Paytm, etc.)`}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-amber-100/90 block sm:hidden">
                  Opens GPay • PhonePe • Paytm • Any UPI App
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Quick manual confirmation button if user already paid or used QR */}
            <div className="flex items-center justify-center pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (finalAmount <= 0) {
                    setError('Please select or enter an amount greater than ₹0.');
                    return;
                  }
                  setError('');
                  setShowConfirmModal(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300/80 py-2 px-4 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Already Paid or Scanned QR? Confirm &amp; Get Receipt</span>
              </button>
            </div>

            {/* Quick helper for GPay / UPI troubleshooting */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium text-center flex-wrap pt-0.5">
              <span>Google Pay error? Use</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="text-amber-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                Copy UPI ID
              </button>
              <span>or</span>
              <button
                type="button"
                onClick={() => setShowQrOnMobile(!showQrOnMobile)}
                className="text-amber-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                Scan QR Code
              </button>
            </div>

            {/* Dynamic QR Code & 1-Click Copy Section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80">
              <div className="space-y-2 flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Scan QR Code with any UPI App
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Using a computer or another phone? Scan with Google Pay, PhonePe, or Paytm, or copy the UPI ID below.
                </p>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-stone-200 text-xs w-full max-w-sm">
                  <div className="truncate flex-1 min-w-0">
                    <span className="text-[10px] text-stone-400 block font-medium">UPI ID:</span>
                    <span className="font-mono text-stone-900 font-bold text-xs truncate block">{upiPayee}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300/80 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* Mobile Toggle Button for QR Code */}
                <button
                  type="button"
                  onClick={() => setShowQrOnMobile(!showQrOnMobile)}
                  className="sm:hidden w-full py-2 px-3 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showQrOnMobile ? 'Hide QR Code' : 'Show QR Code to Scan'}</span>
                </button>
              </div>

              {/* QR Code Container */}
              <div
                className={`flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-2xs border border-stone-200 shrink-0 ${
                  showQrOnMobile ? 'flex' : 'hidden sm:flex'
                }`}
              >
                <QRCodeSVG
                  value={universalUpiUri}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
                <span className="text-[10px] font-extrabold text-stone-600 mt-2 uppercase tracking-wider text-center">
                  Scan to Pay {formatCurrency(finalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approach 1: App Return / Payment Confirmation Modal */}
      {showConfirmModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4 flex min-h-full items-center justify-center animate-in fade-in-0 duration-150">
          <div className="relative bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 backdrop-blur-xs rounded-xl text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Confirm Payment</h3>
                  <p className="text-[11px] text-amber-100">
                    Did you complete your transfer in Google Pay / PhonePe?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {confirmError && (
                <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{confirmError}</span>
                </div>
              )}

              {/* Payment Summary Box */}
              <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-stone-200">
                  <span className="text-stone-500">Contributor:</span>
                  <span className="font-bold text-stone-900">{effectiveDonorName}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-stone-200">
                  <span className="text-stone-500">Paid To Custodian:</span>
                  <span className="font-bold text-stone-900">{activeAccount.name}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-stone-200">
                  <span className="text-stone-500">UPI ID:</span>
                  <span className="font-mono font-bold text-amber-700">{activeAccount.upiId}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-stone-500 font-bold">Transfer Amount:</span>
                  <span className="text-base font-black text-emerald-700">{formatCurrency(finalAmount)}</span>
                </div>
              </div>

              {/* Optional UTR Input Field */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  UPI Ref / UTR Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="12-digit UTR (e.g. 4245xxxxxxxx)"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 20))}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 bg-white border border-stone-300 text-stone-900 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10.5px] text-stone-500 leading-tight">
                  💡 Found on Google Pay / PhonePe screen after payment. Entering this helps the committee verify your entry instantly.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Recording Receipt...' : 'Yes, I Have Completed Payment'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setShowQrOnMobile(true);
                  }}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>No, Payment Didn&apos;t Complete / Need Help</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}