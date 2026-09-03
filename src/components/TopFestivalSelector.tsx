'use client';

import React, { useEffect, useState } from 'react';
import { FY_OPTIONS, DEFAULT_FESTIVALS } from '@/lib/festivalUtils';
import { Calendar, Sparkles, ChevronDown, Check, ArrowRightLeft } from 'lucide-react';

interface TopFestivalSelectorProps {
  selectedFy: string;
  onFyChange: (fy: string) => void;
  selectedFestival: string;
  onFestivalChange: (fest: string) => void;
  onOpenTransferModal?: () => void;
  showTransferButton?: boolean;
}

export default function TopFestivalSelector({
  selectedFy,
  onFyChange,
  selectedFestival,
  onFestivalChange,
  onOpenTransferModal,
  showTransferButton = false,
}: TopFestivalSelectorProps) {
  const [festivals, setFestivals] = useState<string[]>(DEFAULT_FESTIVALS);
  const [festivalDropdownOpen, setFestivalDropdownOpen] = useState(false);
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadFestivals() {
      try {
        const res = await fetch('/api/festivals');
        if (res.ok) {
          const data = await res.json();
          if (data.festivals && Array.isArray(data.festivals)) {
            const merged = Array.from(new Set([...DEFAULT_FESTIVALS, ...data.festivals]));
            setFestivals(merged);
          }
        }
      } catch (e) {
        console.error('Failed to load festivals in TopFestivalSelector:', e);
      }
    }
    loadFestivals();
  }, []);

  const currentFyLabel = FY_OPTIONS.find((f) => f.value === selectedFy)?.label || `FY ${selectedFy}`;
  const currentFestLabel = selectedFestival === 'all' ? 'All Festivals & Events' : selectedFestival;

  // Top 4 quick-pick festivals
  const quickPicks = ['all', 'Ganesh Festival', 'Navratri Festival', 'Dahi Handi', 'General / Society Events'];

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-sm border border-stone-200/90 space-y-3">
      {/* Top Row: Selectors & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* 1. Modern Financial Year (FY) Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFyDropdownOpen(!fyDropdownOpen);
                setFestivalDropdownOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-stone-100/80 hover:bg-stone-200/70 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 transition-all shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{currentFyLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform ${fyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {fyDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFyDropdownOpen(false)} />
                <div className="absolute left-0 mt-1.5 z-50 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 animate-in fade-in-0 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Select Financial Year
                  </div>
                  {FY_OPTIONS.map((opt) => {
                    const isSel = selectedFy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onFyChange(opt.value);
                          setFyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSel ? 'bg-rose-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-amber-300" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 2. Modern Dynamic Festival Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setFestivalDropdownOpen(!festivalDropdownOpen);
                setFyDropdownOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-50 to-amber-50/50 hover:from-rose-100/80 hover:to-amber-100/60 border border-rose-200/80 rounded-xl text-xs font-bold text-rose-950 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{currentFestLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-rose-800 transition-transform ${festivalDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {festivalDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFestivalDropdownOpen(false)} />
                <div className="absolute left-0 sm:left-auto mt-1.5 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 animate-in fade-in-0 duration-150 max-h-80 overflow-y-auto">
                  <div className="px-3.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Festival Filter
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onFestivalChange('all');
                      setFestivalDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedFestival === 'all'
                        ? 'bg-rose-900 text-white font-bold'
                        : 'text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <span>✨ All Festivals & Events</span>
                    {selectedFestival === 'all' && <Check className="w-3.5 h-3.5 text-amber-300" />}
                  </button>

                  <div className="my-1 border-t border-stone-100" />

                  {festivals.map((f) => {
                    const isSel = selectedFestival === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          onFestivalChange(f);
                          setFestivalDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          isSel ? 'bg-rose-900 text-white font-bold' : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="truncate pr-2">{f}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transfer Fund Action Button (if requested) */}
        {showTransferButton && onOpenTransferModal && (
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-900 via-rose-950 to-stone-900 text-amber-200 text-xs font-bold rounded-xl shadow-sm hover:brightness-110 transition-all active:scale-95 shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
            + Transfer Fund
          </button>
        )}
      </div>

      {/* Quick Festival Chip Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
          Quick View:
        </span>
        {quickPicks.map((pick) => {
          const isSelected = selectedFestival === pick;
          const display = pick === 'all' ? 'All' : pick === 'General / Society Events' ? 'General' : pick;
          return (
            <button
              key={pick}
              type="button"
              onClick={() => onFestivalChange(pick)}
              className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-rose-900 text-amber-200 shadow-xs ring-2 ring-rose-900/30'
                  : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
              }`}
            >
              {display}
            </button>
          );
        })}
      </div>
    </div>
  );
}