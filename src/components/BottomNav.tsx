'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, IndianRupee, TrendingDown, Gift, MoreHorizontal, Plus } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, setAddDepositModalOpen, setAddExpenseModalOpen } = useAuth();

  const items = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Received', href: '/deposits', icon: IndianRupee },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Donations', href: '/donations', icon: Gift },
    { name: 'Ledger', href: '/transactions', icon: MoreHorizontal },
  ];

  return (
    <>
      {/* Mobile Sticky Quick Action Bar when Authenticated */}
      {isAuthenticated && (
        <div className="md:hidden fixed bottom-16 right-4 z-40 flex flex-col gap-2">
          <button
            onClick={() => setAddDepositModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Deposit
          </button>
          <button
            onClick={() => setAddExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-full shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Expense
          </button>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 h-14 flex items-center justify-around px-2 shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-rose-900 font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}