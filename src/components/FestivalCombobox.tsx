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
  placeholder = 'Type or select festival (e.g. Dahi Handi)...',
}: FestivalComboboxProps) {
  const [festivals, setFestivals] = useState<string[]>(DEFAULT_FESTIVALS);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
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

  const selectOrCreate = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    // Check if there is an existing festival with different casing
    const existing = festivals.find((f) => f.toLowerCase() === cleanName.toLowerCase());
    const finalName = existing || cleanName;

    onChange(finalName);
    setQuery(finalName);
    setIsOpen(false);

    // If it's brand new, add locally and persist to backend
    if (!existing) {
      setFestivals((prev) => [...prev, finalName]);
      try {
        await fetch('/api/festivals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: finalName }),
        });
      } catch (err) {
        console.error('Failed to persist festival:', err);
      }
    }
  };

  // Handle outside click to close dropdown & commit typed text
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const trimmed = query.trim();
        if (!trimmed) {
          // Revert to current selected value or default
          setQuery(value || 'Ganesh Festival');
          onChange(value || 'Ganesh Festival');
        } else if (trimmed !== value) {
          selectOrCreate(trimmed);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, value, festivals]);

  const trimmedQuery = query.trim();
  const exactMatch = festivals.find(
    (f) => f.toLowerCase() === trimmedQuery.toLowerCase()
  );

  const filtered = festivals.filter((f) =>
    f.toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-extrabold text-stone-700 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[10px] text-stone-400 font-semibold">Type to search or add</span>
        </div>
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
              if (exactMatch) {
                selectOrCreate(exactMatch);
              } else if (filtered.length > 0 && trimmedQuery) {
                // If there is a filtered match, select first match
                selectOrCreate(filtered[0]);
              } else if (trimmedQuery) {
                // Add new festival
                selectOrCreate(trimmedQuery);
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-2.5 text-xs font-bold text-stone-900 bg-white hover:bg-stone-50/50 border border-stone-300 hover:border-stone-400 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none shadow-2xs transition-all"
        />

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
                setIsOpen(true);
              }}
              className="p-0.5 text-stone-400 hover:text-stone-700 rounded-md transition-colors"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in-0 duration-150 max-h-72 flex flex-col">
          {/* Quick chips bar for 1-tap selection */}
          <div className="p-2 bg-stone-50/90 border-b border-stone-200/80 flex flex-wrap gap-1.5">
            {['Ganesh Festival', 'Navratri Festival', 'Dahi Handi', 'Kojagiri', 'Diwali', 'General / Society Events'].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => selectOrCreate(chip)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                  value === chip
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {chip === 'General / Society Events' ? 'General' : chip}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto p-1.5 space-y-0.5">
            {/* Create New Festival Option if typed query does not exactly match any existing festival */}
            {trimmedQuery && !exactMatch && (
              <button
                type="button"
                onClick={() => selectOrCreate(trimmedQuery)}
                className="w-full text-left p-2.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100/80 rounded-xl flex items-center justify-between transition-all border border-amber-200/90 shadow-2xs group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-amber-600 group-hover:bg-amber-700 text-white rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-black">Add &ldquo;{trimmedQuery}&rdquo;</span>
                    <span className="text-[10px] text-amber-800 font-semibold block">Create as new festival in records</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-200/80 text-amber-950 uppercase tracking-wider font-extrabold rounded-md">
                  Press Enter
                </span>
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
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-stone-900 text-white font-black shadow-2xs'
                      : 'text-stone-800 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span>{fest}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                </button>
              );
            })}

            {filtered.length === 0 && !trimmedQuery && (
              <div className="p-3 text-center text-xs text-stone-400">No festivals found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}