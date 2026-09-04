'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Share2,
  Copy,
  Check,
  Building2,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { DEFAULT_FESTIVALS } from '@/lib/festivalUtils';

interface ShareFlatLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFlat?: string;
  defaultFestival?: string;
}

export default function ShareFlatLinkModal({
  isOpen,
  onClose,
  defaultFlat = '',
  defaultFestival = 'Ganesh Festival',
}: ShareFlatLinkModalProps) {
  const [flats, setFlats] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<string[]>(DEFAULT_FESTIVALS);
  const [selectedFlat, setSelectedFlat] = useState<string>(defaultFlat || '101');
  const [selectedFestival, setSelectedFestival] = useState<string>(defaultFestival);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [flatsRes, festRes] = await Promise.all([
          fetch('/api/flats'),
          fetch('/api/festivals'),
        ]);
        if (flatsRes.ok) {
          const f = await flatsRes.json();
          if (f.flats) setFlats(f.flats);
        }
        if (festRes.ok) {
          const fe = await festRes.json();
          if (fe.festivals) {
            setFestivals(Array.from(new Set([...DEFAULT_FESTIVALS, ...fe.festivals])));
          }
        }
      } catch (e) {}
    }
    if (isOpen) loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Origin URL (defaults to production or current window)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pt-utsav-samiti.vercel.app';
  const cleanFlat = selectedFlat.replace(/[^0-9]/g, '');
  const shareUrl = `${baseUrl}/?flat=${cleanFlat}&fest=${encodeURIComponent(selectedFestival)}`;

  const whatsappMessage = `*Pari Tower Utsav Samiti*\n\nDear Resident of *Flat ${cleanFlat}*,\nKindly make your contribution for *${selectedFestival}*.\n\nTap this link to open the payment page with your flat pre-filled, and pay with 1-tap via Google Pay or PhonePe:\n👉 ${shareUrl}\n\nThank you for your generous support! 🙏`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-stone-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-rose-950 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Share Flat Payment Link & QR</h3>
              <p className="text-[11px] text-amber-200">
                Generate personalized WhatsApp link & QR code for any flat.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-rose-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Flat & Festival Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Select Flat *
              </label>
              <select
                value={selectedFlat}
                onChange={(e) => setSelectedFlat(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
              >
                {flats.map((fl) => (
                  <option key={fl.id} value={fl.altName || fl.displayName}>
                    Flat {fl.altName || fl.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Festival *
              </label>
              <select
                value={selectedFestival}
                onChange={(e) => setSelectedFestival(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:outline-none"
              >
                {festivals.map((fest) => (
                  <option key={fest} value={fest}>
                    {fest}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generated QR Code Card */}
          <div className="bg-gradient-to-b from-stone-50 to-amber-50/50 p-4 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-200">
              <QRCodeSVG value={shareUrl} size={160} level="M" />
            </div>

            <div>
              <span className="text-xs font-extrabold text-stone-900 block">
                Flat {cleanFlat} • {selectedFestival}
              </span>
              <span className="text-[11px] text-stone-500 block">
                Scanning this QR opens the payment page with Flat {cleanFlat} pre-filled.
              </span>
            </div>
          </div>

          {/* Share Actions */}
          <div className="space-y-2 pt-1">
            {/* WhatsApp Share Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Share on WhatsApp to Flat {cleanFlat}
            </a>

            {/* Copy Link Input */}
            <div className="flex items-center gap-2 bg-stone-100 p-2 rounded-xl border border-stone-300">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full text-xs font-mono bg-transparent text-stone-700 focus:outline-none px-1"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}