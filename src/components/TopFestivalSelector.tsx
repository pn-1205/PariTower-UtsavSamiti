'use client';

import React, { useEffect, useState } from 'react';
import { FY_OPTIONS, DEFAULT_FESTIVALS } from '@/lib/festivalUtils';
import { Calendar, Sparkles, ChevronDown, Check, ArrowRightLeft, Search, Plus, X } from 'lucide-react';

interface TopFestivalSelectorProps {
  selectedFy: string;
  onFyChange: (fy: string) => void;
  selectedFestival: string;
  onFestivalChange: (fest: string) => void;
  onOpenTransferModal?: () => void;
  showTransferButton?: boolean;
  hideFestival?: boolean;
}

export default function TopFestivalSelector({
  selectedFy,
  onFyChange,
  selectedFestival,
  onFestivalChange,
  onOpenTransferModal,
  showTransferButton = false,
  hideFestival = false,
}: TopFestivalSelectorProps) {
  const [festivals, setFestivals] = useState<string[]>(DEFAULT_FESTIVALS);
  const [festivalDropdownOpen, setFestivalDropdownOpen] = useState(false);
  const [fyDropdownOpen, setFyDropdownOpen] = useState(false);
  const [festivalSearch, setFestivalSearch] = useState('');

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

  const isAnyDropdownOpen = fyDropdownOpen || festivalDropdownOpen;

  return (
    <div className={`bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-sm border border-stone-200/90 relative ${isAnyDropdownOpen ? 'z-40' : 'z-20'}`}>
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
                          isSel ? 'bg-amber-50 text-amber-900 font-bold border-y border-amber-200/80' : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 2. Modern Dynamic Festival Selector (if not hidden) */}
          {!hideFestival && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setFestivalDropdownOpen(!festivalDropdownOpen);
                  setFyDropdownOpen(false);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-bold text-stone-900 transition-all shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{currentFestLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${festivalDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {festivalDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFestivalDropdownOpen(false)} />
                  <div className="absolute left-0 sm:left-auto mt-1.5 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 animate-in fade-in-0 duration-150 max-h-64 overflow-y-auto flex flex-col">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Festival Filter
                    </div>

                    {/* Dynamic Search & Add Input */}
                    <div className="px-2.5 pb-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={festivalSearch}
                          onChange={(e) => setFestivalSearch(e.target.value)}
                          placeholder="Search or add festival..."
                          className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold text-stone-900 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        {festivalSearch && (
                          <button
                            type="button"
                            onClick={() => setFestivalSearch('')}
                            className="absolute right-2 top-2 text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Add new festival button if search query doesn't match */}
                    {festivalSearch.trim() && !festivals.some((f) => f.toLowerCase() === festivalSearch.trim().toLowerCase()) && (
                      <div className="px-2 pb-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            const newName = festivalSearch.trim();
                            onFestivalChange(newName);
                            setFestivalDropdownOpen(false);
                            setFestivalSearch('');
                            setFestivals((prev) => [...prev, newName]);
                            try {
                              await fetch('/api/festivals', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: newName }),
                              });
                            } catch (e) {}
                          }}
                          className="w-full text-left p-2 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center justify-between border border-amber-200"
                        >
                          <div className="flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-amber-600" />
                            <span>Add &ldquo;{festivalSearch.trim()}&rdquo;</span>
                          </div>
                          <span className="text-[10px] text-amber-800 font-extrabold uppercase">Add New</span>
                        </button>
                      </div>
                    )}

                    <div className="overflow-y-auto divide-y divide-stone-50">
                      <button
                        type="button"
                        onClick={() => {
                          onFestivalChange('all');
                          setFestivalDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          selectedFestival === 'all'
                            ? 'bg-amber-50 text-amber-900 font-bold border-y border-amber-200/80'
                            : 'text-stone-800 hover:bg-stone-50'
                        }`}
                      >
                        <span>✨ All Festivals & Events</span>
                        {selectedFestival === 'all' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>

                      {festivals
                        .filter((f) => f.toLowerCase().includes(festivalSearch.toLowerCase().trim()))
                        .map((f) => {
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
                                isSel ? 'bg-amber-50 text-amber-900 font-bold border-y border-amber-200/80' : 'text-stone-700 hover:bg-stone-50'
                              }`}
                            >
                              <span className="truncate pr-2">{f}</span>
                              {isSel && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Transfer Fund Action Button (if requested) */}
        {showTransferButton && onOpenTransferModal && (
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-amber-300 text-xs font-bold rounded-xl shadow-xs hover:brightness-110 transition-all active:scale-95 shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            + Transfer Fund
          </button>
        )}
      </div>
    </div>
  );
}