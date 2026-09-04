'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

export type CustomSelectTheme = 'emerald' | 'rose' | 'amber' | 'indigo' | 'stone' | 'maroon';

const THEME_STYLES: Record<CustomSelectTheme, {
  triggerFocus: string;
  selectedItem: string;
  selectedText: string;
  selectedIcon: string;
  checkIcon: string;
  activeBorder: string;
}> = {
  emerald: {
    triggerFocus: 'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
    selectedItem: 'bg-emerald-50 text-emerald-950 border border-emerald-200/90 shadow-2xs',
    selectedText: 'text-emerald-950 font-black',
    selectedIcon: 'text-emerald-600',
    checkIcon: 'text-emerald-600',
    activeBorder: 'border-emerald-500',
  },
  rose: {
    triggerFocus: 'focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500',
    selectedItem: 'bg-rose-50 text-rose-950 border border-rose-200/90 shadow-2xs',
    selectedText: 'text-rose-950 font-black',
    selectedIcon: 'text-rose-600',
    checkIcon: 'text-rose-600',
    activeBorder: 'border-rose-500',
  },
  amber: {
    triggerFocus: 'focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500',
    selectedItem: 'bg-amber-50 text-amber-950 border border-amber-200/90 shadow-2xs',
    selectedText: 'text-amber-950 font-black',
    selectedIcon: 'text-amber-600',
    checkIcon: 'text-amber-600',
    activeBorder: 'border-amber-500',
  },
  indigo: {
    triggerFocus: 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
    selectedItem: 'bg-indigo-50 text-indigo-950 border border-indigo-200/90 shadow-2xs',
    selectedText: 'text-indigo-950 font-black',
    selectedIcon: 'text-indigo-600',
    checkIcon: 'text-indigo-600',
    activeBorder: 'border-indigo-500',
  },
  stone: {
    triggerFocus: 'focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500',
    selectedItem: 'bg-stone-100 text-stone-950 border border-stone-300 shadow-2xs',
    selectedText: 'text-stone-950 font-black',
    selectedIcon: 'text-stone-700',
    checkIcon: 'text-stone-700',
    activeBorder: 'border-stone-500',
  },
  maroon: {
    triggerFocus: 'focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900',
    selectedItem: 'bg-rose-50 text-rose-950 border border-rose-300 shadow-2xs',
    selectedText: 'text-rose-950 font-black',
    selectedIcon: 'text-rose-900',
    checkIcon: 'text-rose-900',
    activeBorder: 'border-rose-900',
  },
};

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (CustomSelectOption | string)[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  headerLabel?: string;
  className?: string;
  theme?: CustomSelectTheme;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  icon: TriggerIcon,
  headerLabel,
  className = '',
  theme = 'amber',
  size = 'sm',
  disabled = false,
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

  const tStyles = THEME_STYLES[theme] || THEME_STYLES.amber;
  const isSizeSm = size === 'sm';

  return (
    <div className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-white hover:bg-stone-50/80 border rounded-xl shadow-2xs transition-all cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? `${tStyles.activeBorder} ring-2 ${tStyles.triggerFocus.split(' ')[1]}` : 'border-stone-200'
        } ${tStyles.triggerFocus} ${
          isSizeSm ? 'px-3.5 py-2 text-xs font-bold text-stone-800' : 'px-3.5 py-2.5 text-sm font-semibold text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {ActiveIcon && <ActiveIcon className="w-4 h-4 text-stone-500 shrink-0" />}
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? `rotate-180 ${tStyles.selectedIcon}` : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          {/* Click-outside dismissal backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute left-0 mt-1.5 z-50 w-full min-w-[220px] bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 animate-in fade-in-0 zoom-in-95 duration-150 max-h-64 overflow-y-auto">
            {headerLabel && (
              <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
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
                        ? tStyles.selectedItem
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 truncate">
                      <div className="flex items-center gap-2 truncate">
                        {ItemIcon && (
                          <ItemIcon className={`w-3.5 h-3.5 ${isSelected ? tStyles.selectedIcon : 'text-stone-400'}`} />
                        )}
                        <span className={`truncate ${isSelected ? tStyles.selectedText : ''}`}>{opt.label}</span>
                      </div>
                      {opt.description && (
                        <span className="text-[10px] text-stone-400 font-normal pl-5 truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className={`w-4 h-4 ${tStyles.checkIcon} stroke-[3] shrink-0 ml-2`} />}
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
