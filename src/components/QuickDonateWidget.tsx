'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { DEFAULT_FESTIVALS } from '@/lib/festivalUtils';
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

  // URL parameters for Option 2 (pre-filled flat & festival)
  const initialFlat = searchParams.get('flat') || '';
  const initialFest = searchParams.get('fest') || '';
  const initialAcc = searchParams.get('acc') || '';

  const [festivals, setFestivals] = useState<string[]>(DEFAULT_FESTIVALS);
  const [accounts, setAccounts] = useState<any[]>(DEFAULT_UPI_ACCOUNTS);
  const [flats, setFlats] = useState<any[]>([]);

  // Form states
  const [selectedFestival, setSelectedFestival] = useState<string>(initialFest || 'Ganesh Festival');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAcc || 'acc_suryakant');
  const [donorType, setDonorType] = useState<'flat' | 'other'>('flat');
  const [flatNumberInput, setFlatNumberInput] = useState<string>(initialFlat);
  const [selectedFlatId, setSelectedFlatId] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('351');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Dropdown states
  const [festivalDropdownOpen, setFestivalDropdownOpen] = useState<boolean>(false);
  const festivalDropdownRef = useRef<HTMLDivElement>(null);

  // Close festival dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (festivalDropdownRef.current && !festivalDropdownRef.current.contains(event.target as Node)) {
        setFestivalDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // UI flow states
  const [copied, setCopied] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [showQrOnMobile, setShowQrOnMobile] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      setIsAndroid(/android/i.test(ua));
      setIsIOS(/iphone|ipad|ipod/i.test(ua));
    }
  }, []);

  // Quick amount preset chips (minimum 351, 501, 1100, 2100, 5100)
  const PRESET_AMOUNTS = ['351', '501', '1100', '2100', '5100'];

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
            // Filter strictly for active accounts with valid UPI IDs
            const upiAccounts = aData.accounts.filter(
              (a: any) => a.accountType === 'UPI_BANK' && a.upiId && a.isActive !== false
            );
            if (upiAccounts.length > 0) {
              setAccounts(upiAccounts);
              // Default selected account
              if (initialAcc) {
                const matched = upiAccounts.find((a: any) => a.id === initialAcc);
                if (matched) setSelectedAccountId(matched.id);
                else setSelectedAccountId(upiAccounts[0].id);
              } else {
                const def = upiAccounts.find((a: any) => a.isDefault) || upiAccounts[0];
                setSelectedAccountId(def.id);
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
    id: 'acc_suryakant',
    name: 'Suryakant Dilip Sabale',
    upiId: '9921137881@icici',
  };

  const finalAmount = amount === 'custom' ? parseFloat(customAmount) || 0 : parseFloat(amount) || 0;

  // Compute effective donor name (auto-fill from flat if entered)
  const effectiveDonorName =
    donorName.trim() || (donorType === 'flat' && flatNumberInput.trim() ? `Flat ${flatNumberInput.trim()}` : '');

  // NPCI-compliant parameters
  const upiPayee = activeAccount.upiId || '9921137881@icici';
  const cleanName = (activeAccount.name || 'Pari Tower Samiti')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 50);

  const amtStr = finalAmount > 0 ? String(finalAmount) : '';
  const rawNote = `${selectedFestival} ${effectiveDonorName || 'Utsav'}`;
  const cleanNote = rawNote.replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 30);

  const queryParams = `pa=${encodeURIComponent(upiPayee)}&pn=${encodeURIComponent(cleanName)}&am=${encodeURIComponent(amtStr)}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  // 1. Standard Universal UPI URI (for iOS, scanners, and universal handlers)
  const universalUpiUri = `upi://pay?${queryParams}`;

  // 2. Android Chrome Universal Intent (triggers system UPI app chooser dialog directly)
  const androidGenericIntent = `intent://upi/pay?${queryParams}#Intent;scheme=upi;end;`;

  // 3. Specific App Intents with Play Store fallback
  const gpayLink = isAndroid
    ? `intent://upi/pay?${queryParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=${encodeURIComponent(universalUpiUri)};end;`
    : `tez://upi/pay?${queryParams}`;

  const phonepeLink = isAndroid
    ? `intent://upi/pay?${queryParams}#Intent;scheme=upi;package=com.phonepe.app;S.browser_fallback_url=${encodeURIComponent(universalUpiUri)};end;`
    : `phonepe://pay?${queryParams}`;

  const paytmLink = isAndroid
    ? `intent://upi/pay?${queryParams}#Intent;scheme=upi;package=net.one97.paytm;S.browser_fallback_url=${encodeURIComponent(universalUpiUri)};end;`
    : `paytmmp://pay?${queryParams}`;

  const bhimLink = isAndroid
    ? `intent://upi/pay?${queryParams}#Intent;scheme=upi;package=in.org.npci.upiapp;S.browser_fallback_url=${encodeURIComponent(universalUpiUri)};end;`
    : universalUpiUri;

  const credLink = isAndroid
    ? `intent://upi/pay?${queryParams}#Intent;scheme=upi;package=com.dreamplug.androidapp;S.browser_fallback_url=${encodeURIComponent(universalUpiUri)};end;`
    : universalUpiUri;

  // Primary link for universal 1-tap button
  const primaryUpiLink = isAndroid ? androidGenericIntent : universalUpiUri;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiPayee);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Synchronously launch payment link and asynchronously log pending transaction
  const handlePayClick = (e: React.MouseEvent<HTMLAnchorElement>, targetUri: string) => {
    setError('');

    if (finalAmount <= 0) {
      e.preventDefault();
      setError('Please select or enter an amount greater than ₹0.');
      return;
    }

    if (!effectiveDonorName) {
      e.preventDefault();
      setError(
        donorType === 'flat'
          ? 'Please enter your Flat number or Name.'
          : 'Please enter your Name before making payment.'
      );
      return;
    }

    // Trigger direct window.location as secondary safeguard in same user event
    try {
      window.location.href = targetUri;
    } catch (_) {}

    // In background, log the transaction to database with exact timestamp
    try {
      fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          amount: finalAmount,
          donorName: effectiveDonorName,
          festival: selectedFestival,
          flatId: donorType === 'flat' ? selectedFlatId : null,
          contributorName: donorType === 'flat' ? null : effectiveDonorName,
          contributorCategory: donorType === 'flat' ? 'Resident' : 'Well-wisher',
          paymentAccountId: activeAccount.id,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.receiptNo) {
            setSuccessReceipt(data);
            triggerFestiveConfetti();
          }
        })
        .catch((err) => console.error('Error logging payment:', err));
    } catch (err) {
      console.error(err);
    }
  };

  // Manual payment recording (e.g. after QR scan or direct bank transfer)
  const handleManualRecord = async () => {
    setError('');

    if (finalAmount <= 0) {
      setError('Please select or enter an amount greater than ₹0.');
      return;
    }

    if (!effectiveDonorName) {
      setError(
        donorType === 'flat'
          ? 'Please enter your Flat number or Name.'
          : 'Please enter your Name before recording payment.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: effectiveDonorName,
          festival: selectedFestival,
          flatId: donorType === 'flat' ? selectedFlatId : null,
          contributorName: donorType === 'flat' ? null : effectiveDonorName,
          contributorCategory: donorType === 'flat' ? 'Resident' : 'Well-wisher',
          paymentAccountId: activeAccount.id,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to record payment.');
      } else {
        setSuccessReceipt(data);
        triggerFestiveConfetti();
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="donate-section"
      className="bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 text-white rounded-3xl shadow-2xl p-5 sm:p-7 border border-amber-500/40 relative overflow-hidden ring-1 ring-amber-400/20"
    >
      {/* Magic UI Border Beam animated aura */}
      <BorderBeam size={320} duration={12} borderWidth={2} colorFrom="#f59e0b" colorTo="#ef4444" />

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

        {/* SmoothUI Receiver Account Badge with Live Status Indicator */}
        <div className="bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-400/30 text-xs shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Official Receiving Account:
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-extrabold text-white text-sm block">
            {activeAccount.name}
          </span>
          <span className="text-[11px] text-amber-200 block font-mono">
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
          <div className="space-y-3.5">
            {/* Festival Custom Dropdown */}
            <div className="relative" ref={festivalDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                  Festival / Event *
                </label>
                <span className="text-[10px] text-amber-200/70 font-medium">Select utsav celebration</span>
              </div>
              <button
                type="button"
                onClick={() => setFestivalDropdownOpen(!festivalDropdownOpen)}
                className="w-full text-xs font-bold px-3.5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-amber-400/50 text-white rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none flex items-center justify-between transition-all shadow-inner"
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                  <span className="truncate">{selectedFestival}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-300 transition-transform duration-200 flex-shrink-0 ${
                    festivalDropdownOpen ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {festivalDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-stone-900/95 backdrop-blur-xl border border-amber-500/30 rounded-xl shadow-2xl p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                  {festivals.map((f) => {
                    const isFestSelected = selectedFestival === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setSelectedFestival(f);
                          setFestivalDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                          isFestSelected
                            ? 'bg-amber-400 text-rose-950 font-black shadow-sm'
                            : 'text-stone-200 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{f}</span>
                        {isFestSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Receiving Account 2-Option Card Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                  Payee Account (Receiver) *
                </label>
                <span className="text-[10px] text-amber-200/80 font-semibold">100% direct committee receiver</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {accounts.map((acc) => {
                  const isSelected = activeAccount.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`relative text-left p-3 rounded-xl border transition-all duration-200 flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                          : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400 text-rose-950'
                            : 'border-stone-500 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black truncate text-white">{acc.name}</span>
                          {acc.isDefault && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-400/30 text-amber-300 rounded font-bold border border-amber-400/40 flex-shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-amber-200 font-mono font-bold tracking-tight truncate mt-0.5">
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
            <div className="space-y-3 w-full md:flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Instant Payment (Mobile UPI)
                </span>
                <span className="text-xs font-black text-amber-200">
                  Amount: {formatCurrency(finalAmount)}
                </span>
              </div>

              {/* Inline validation error display right above buttons */}
              {error && (
                <div className="p-2.5 text-xs bg-red-950/90 text-red-200 rounded-xl border border-red-500/60 font-bold flex items-center gap-2 animate-in fade-in-0 duration-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Main Universal 1-Tap Intent Link with Shimmer Effect */}
              <a
                href={primaryUpiLink}
                onClick={(e) => handlePayClick(e, primaryUpiLink)}
                className="w-full flex items-center justify-center gap-2.5 py-4 px-4 shimmer-bg hover:brightness-105 text-rose-950 font-black text-sm rounded-xl shadow-xl transition-all transform active:scale-95 text-center cursor-pointer select-none ring-2 ring-amber-300/80 shadow-amber-500/20"
              >
                <Smartphone className="w-5 h-5 shrink-0 animate-bounce" />
                <span className="tracking-wide">Pay via UPI App (GPay / PhonePe / Paytm)</span>
                <ArrowRight className="w-4.5 h-4.5 shrink-0" />
              </a>

              {/* App-specific shortcuts */}
              <div>
                <div className="text-[10px] text-stone-300 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Or choose your preferred UPI app:</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  <a
                    href={gpayLink}
                    onClick={(e) => handlePayClick(e, gpayLink)}
                    className="text-center py-2 px-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-[10px] font-bold transition-all border border-white/10 flex items-center justify-center gap-1"
                  >
                    🟢 GPay
                  </a>
                  <a
                    href={phonepeLink}
                    onClick={(e) => handlePayClick(e, phonepeLink)}
                    className="text-center py-2 px-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-[10px] font-bold transition-all border border-white/10 flex items-center justify-center gap-1"
                  >
                    🟣 PhonePe
                  </a>
                  <a
                    href={paytmLink}
                    onClick={(e) => handlePayClick(e, paytmLink)}
                    className="text-center py-2 px-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-[10px] font-bold transition-all border border-white/10 flex items-center justify-center gap-1"
                  >
                    🔵 Paytm
                  </a>
                  <a
                    href={bhimLink}
                    onClick={(e) => handlePayClick(e, bhimLink)}
                    className="text-center py-2 px-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-[10px] font-bold transition-all border border-white/10 flex items-center justify-center gap-1"
                  >
                    🇮🇳 BHIM
                  </a>
                  <a
                    href={credLink}
                    onClick={(e) => handlePayClick(e, credLink)}
                    className="text-center py-2 px-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-[10px] font-bold transition-all border border-white/10 flex items-center justify-center gap-1 col-span-2 sm:col-span-1"
                  >
                    🔴 CRED
                  </a>
                </div>
              </div>

              {/* UPI ID copy box */}
              <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-white/10 text-xs">
                <div className="truncate pr-2">
                  <span className="text-stone-400 text-[10px] block font-medium">
                    Payee: <strong className="text-white">{activeAccount.name}</strong>
                  </span>
                  <span className="font-mono text-amber-200 font-bold text-xs">{upiPayee}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied UPI' : 'Copy UPI ID'}
                </button>
              </div>

              {/* Mobile QR & Manual fallback toggle */}
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowQrOnMobile(!showQrOnMobile)}
                  className="text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1 md:hidden"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {showQrOnMobile ? 'Hide QR Code' : 'Scan via QR Code instead'}
                </button>
                <button
                  type="button"
                  onClick={handleManualRecord}
                  disabled={submitting}
                  className="text-stone-300 hover:text-white underline font-semibold ml-auto"
                >
                  {submitting ? 'Recording...' : '✓ I Have Paid (Record My Payment)'}
                </button>
              </div>
            </div>

            {/* Right: Dynamic QR Code (Always visible on desktop, toggle on mobile) */}
            <div
              className={`flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl shadow-xl border-2 border-amber-400 shrink-0 ${
                showQrOnMobile ? 'block' : 'hidden md:flex'
              }`}
            >
              <QRCodeSVG
                value={universalUpiUri}
                size={145}
                level="M"
                includeMargin={false}
              />
              <span className="text-[10px] font-black text-rose-950 mt-2 uppercase tracking-wider">
                Scan with any UPI App
              </span>
              <button
                type="button"
                onClick={handleManualRecord}
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