'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (CustomSelectOption | string)[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  headerLabel?: string;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  icon: TriggerIcon,
  headerLabel,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to object format
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const ActiveIcon = selectedOption?.icon || TriggerIcon;

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-bold text-stone-800 bg-white hover:bg-stone-50/80 border border-stone-200 rounded-xl shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {ActiveIcon && <ActiveIcon className="w-3.5 h-3.5 text-stone-500 shrink-0" />}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-stone-700' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          {/* Click-outside dismissal backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute left-0 mt-1.5 z-50 w-full min-w-[200px] bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 animate-in fade-in-0 zoom-in-95 duration-150 max-h-64 overflow-y-auto">
            {headerLabel && (
              <div className="px-3.5 py-1 text-[10px] font-extrabold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                {headerLabel}
              </div>
            )}

            <div className="space-y-0.5 px-1">
              {normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                const ItemIcon = opt.icon;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {ItemIcon && <ItemIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-stone-400'}`} />}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
