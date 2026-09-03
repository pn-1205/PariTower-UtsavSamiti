'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronDown, Check, Plus, X } from 'lucide-react';
import { DEFAULT_FESTIVALS } from '@/lib/festivalUtils';

interface FestivalComboboxProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function FestivalCombobox({
  value,
  onChange,
  label = 'Festival / Event *',
  required = true,
  className = '',
  placeholder = 'Select or type new festival (e.g. Dahi Handi)...',
}: FestivalComboboxProps) {
  const [festivals, setFestivals] = useState<string[]>(DEFAULT_FESTIVALS);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query if value prop changes externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Fetch dynamic festivals from API
  useEffect(() => {
    let isMounted = true;
    async function loadFestivals() {
      try {
        const res = await fetch('/api/festivals');
        if (res.ok) {
          const data = await res.json();
          if (data.festivals && Array.isArray(data.festivals) && isMounted) {
            // Deduplicate with default festivals
            const merged = Array.from(new Set([...DEFAULT_FESTIVALS, ...data.festivals]));
            setFestivals(merged);
          }
        }
      } catch (e) {
        console.error('Failed to load festivals:', e);
      }
    }
    loadFestivals();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If query was left blank or typed something without choosing, fallback to current selected value
        if (!query.trim()) {
          setQuery(value || 'Ganesh Festival');
          onChange(value || 'Ganesh Festival');
        } else if (query.trim() !== value) {
          // Commit whatever user typed as festival
          selectOrCreate(query.trim());
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, value]);

  // Filtered list
  const filtered = festivals.filter((f) =>
    f.toLowerCase().includes(query.toLowerCase().trim())
  );

  const exactMatch = festivals.some(
    (f) => f.toLowerCase().trim() === query.toLowerCase().trim()
  );

  const selectOrCreate = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    onChange(cleanName);
    setQuery(cleanName);
    setIsOpen(false);

    // If it's a new festival not in list, add locally and persist to backend
    if (!festivals.some((f) => f.toLowerCase() === cleanName.toLowerCase())) {
      setFestivals((prev) => [...prev, cleanName]);
      try {
        await fetch('/api/festivals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName }),
        });
      } catch (err) {
        console.error('Failed to persist festival:', err);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Input Box with Icons */}
      <div className="relative">
        <div className="absolute left-3 top-2.5 text-amber-600 pointer-events-none">
          <Sparkles className="w-4 h-4" />
        </div>

        <input
          type="text"
          required={required}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0 && !exactMatch && query.trim()) {
                // If there's an exact or first match, choose it; else create query
                const first = filtered[0];
                if (first.toLowerCase() === query.toLowerCase().trim()) {
                  selectOrCreate(first);
                } else {
                  selectOrCreate(query);
                }
              } else if (query.trim()) {
                selectOrCreate(query);
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-sm font-semibold text-gray-900 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-900 focus:border-rose-900 focus:outline-none shadow-sm transition-all"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 focus:outline-none"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in-0 duration-150 max-h-64 flex flex-col">
          {/* Quick chips bar for fast tap */}
          <div className="p-2 bg-stone-50/80 border-b border-stone-200/70 flex flex-wrap gap-1.5">
            {['Ganesh Festival', 'Navratri Festival', 'Dahi Handi', 'General / Society Events'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => selectOrCreate(chip)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                  value === chip
                    ? 'bg-rose-900 text-amber-200 shadow-sm'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {chip === 'General / Society Events' ? 'General' : chip}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto p-1.5 divide-y divide-stone-100">
            {/* Create New Festival Option if typed query is not an exact match */}
            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => selectOrCreate(query.trim())}
                className="w-full text-left px-3 py-2 text-xs font-bold text-rose-900 bg-rose-50/70 hover:bg-rose-100 rounded-xl flex items-center justify-between transition-colors my-1 border border-rose-200/60"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-rose-900 text-white rounded-lg">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span>Add new festival: &ldquo;<strong>{query.trim()}</strong>&rdquo;</span>
                </div>
                <span className="text-[10px] text-rose-700 uppercase tracking-wider font-semibold">Press Enter</span>
              </button>
            )}

            {/* List of matching existing festivals */}
            {filtered.map((fest) => {
              const isSelected = value?.toLowerCase().trim() === fest.toLowerCase().trim();
              return (
                <button
                  key={fest}
                  type="button"
                  onClick={() => selectOrCreate(fest)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-rose-900 text-white font-bold'
                      : 'text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-amber-600'}`} />
                    {fest}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-300" />}
                </button>
              );
            })}

            {filtered.length === 0 && !query.trim() && (
              <div className="p-3 text-center text-xs text-stone-400">No festivals available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}