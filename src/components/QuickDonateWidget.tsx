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
  const [appOpenHint, setAppOpenHint] = useState<boolean>(false);
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
  const rawNote = `${selectedFestival} ${effectiveDonorName}`;
  const cleanNote = rawNote.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().slice(0, 30);

  // Preserve literal @ in VPA address so mobile apps (GPay, PhonePe, Paytm) parse correctly
  const queryParams = `pa=${upiPayee}&pn=${encodeURIComponent(cleanName)}&am=${amtStr}&cu=INR&tn=${encodeURIComponent(cleanNote || 'Contribution')}`;

  // Standard Universal UPI URI (triggers Android/iOS native app chooser: GPay, PhonePe, Paytm, etc.)
  const universalUpiUri = `upi://pay?${queryParams}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiPayee);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Launch payment link and asynchronously log pending transaction
  const handlePayClick = (e: React.MouseEvent<HTMLElement>) => {
    setError('');

    if (finalAmount <= 0) {
      e.preventDefault();
      setError('Please select or enter an amount greater than ₹0.');
      return;
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

    // Asynchronously log transaction to database so it's captured in pending records
    setSubmitting(true);
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
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setSuccessReceipt(data);
            triggerFestiveConfetti();
          }
        })
        .catch((err) => console.error('Error recording payment:', err))
        .finally(() => setSubmitting(false));
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }

    if (!isMobile) {
      // On desktop, the QR code is available right on screen
      setShowQrOnMobile(true);
      return;
    }

    // On mobile: directly invoke universal UPI URI to open native Android / iOS chooser sheet
    window.location.href = universalUpiUri;
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

        {/* Receiver Account Badge */}
        <div className="bg-stone-50 border border-stone-200/90 px-3.5 py-2 rounded-2xl text-xs shadow-2xs w-full sm:w-auto shrink-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Receiving Custodian:
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="font-extrabold text-stone-900 text-sm block truncate">
            {activeAccount.name}
          </span>
          <span className="text-[11px] text-amber-700 block font-mono font-bold truncate">
            {activeAccount.upiId || 'Direct UPI'}
          </span>
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
              Your contribution of <strong className="text-emerald-700">{formatCurrency(finalAmount)}</strong> for{' '}
              <strong className="text-amber-800">{selectedFestival}</strong> has been logged.
            </p>
          </div>

          {/* Receipt Info Card */}
          <div className="bg-stone-50 border border-stone-200/90 w-full max-w-sm mx-auto p-3.5 sm:p-4 rounded-2xl text-left text-xs space-y-2 font-mono text-stone-700 shadow-xs">
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
              <span className="text-stone-500">Date & Time:</span>
              <span className="font-bold text-stone-900">
                {new Date().toLocaleTimeString('en-IN')}, {new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-stone-200">
              <span className="text-stone-500">Paid To:</span>
              <span className="font-bold text-stone-900">{activeAccount.name}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-stone-500">Status:</span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded-full border border-amber-200 text-[10px]">
                Pending Committee Verification
              </span>
            </div>
          </div>

          <p className="text-[11px] text-stone-500 max-w-md mx-auto italic">
            No UTR submission needed! The committee matches your payment on their bank/UPI app statement by Name, Amount, and Timestamp.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccessReceipt(null);
                setDonorName('');
              }}
              className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs"
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

          {/* Row 1: Festival & Receiving Account Selection */}
          <div className="space-y-3.5">
            {/* Festival Custom Dropdown */}
            <div className="relative" ref={festivalDropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-extrabold text-stone-700 uppercase tracking-wider">
                  Festival / Event *
                </label>
                <span className="text-[10px] text-stone-400 font-medium">Select celebration</span>
              </div>
              <button
                type="button"
                onClick={() => setFestivalDropdownOpen(!festivalDropdownOpen)}
                className="w-full text-xs font-bold px-3.5 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 hover:border-amber-500 text-stone-900 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none flex items-center justify-between transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="truncate">{selectedFestival}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                    festivalDropdownOpen ? 'rotate-180 text-amber-600' : ''
                  }`}
                />
              </button>

              {festivalDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-stone-200 rounded-xl shadow-xl p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
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
                            ? 'bg-amber-50 text-amber-900 font-black border border-amber-200 shadow-2xs'
                            : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        <span>{f}</span>
                        {isFestSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Receiving Account 2-Option Card Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-extrabold text-stone-700 uppercase tracking-wider">
                  Payee Account (Receiver) *
                </label>
                <span className="text-[10px] text-stone-400 font-semibold">100% direct committee receiver</span>
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
                          ? 'bg-amber-50/50 border-amber-500 text-stone-900 shadow-xs ring-1 ring-amber-500/20'
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
                          {acc.isDefault && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold border border-amber-200 flex-shrink-0">
                              Default
                            </span>
                          )}
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

          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/70 text-center">
            <p className="text-[11px] text-stone-600 font-medium">
              ⚡ <strong>Zero commission • No UTR submission needed:</strong> Clicking pay captures your name, flat, amount, and exact timestamp. The committee verifies against their bank account statement to approve your entry into the ledger.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}