'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import {
  IndianRupee,
  TrendingDown,
  FileText,
  PlusCircle,
  LogOut,
  Lock,
  Gift,
  Home,
  Users,
  BookOpen,
  Menu,
  X,
  Heart,
  CreditCard,
} from 'lucide-react';
import ManagePaymentAccountsModal from './ManagePaymentAccountsModal';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout, setLoginModalOpen, setAddDepositModalOpen, setAddExpenseModalOpen, setAddDonationModalOpen } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountsModalOpen, setAccountsModalOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Donate', href: '/donate', icon: Heart },
    { name: 'Money Received', href: '/deposits', icon: IndianRupee },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Donations', href: '/donations', icon: Gift },
    { name: 'Ledger', href: '/transactions', icon: BookOpen },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Users', href: '/users', icon: Users });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/logo.png"
              alt="Pari Tower Utsav Samiti"
              className="w-10 h-10 rounded-xl shadow-md group-hover:scale-105 transition-transform object-cover"
            />
            <div>
              <span className="font-bold text-gray-900 text-base sm:text-lg tracking-tight">
                Pari Tower Utsav Samiti
              </span>
            </div>
          </Link>

          {/* Right Action: Auth & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Donate Quick Action Button */}
            <Link
              href="/donate"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl shadow-2xs transition-all active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              Donate
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Add Actions Desktop Buttons */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {isAdmin && (
                    <button
                      onClick={() => setAccountsModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg border border-stone-300 transition-colors mr-1"
                      title="Manage UPI & Cash Accounts"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-stone-600" />
                      Accounts
                    </button>
                  )}
                  <button
                    onClick={() => setAddDepositModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Deposit
                  </button>
                  <button
                    onClick={() => setAddExpenseModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Expense
                  </button>
                  <button
                    onClick={() => setAddDonationModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Donation
                  </button>
                </div>

                {/* User Info Badge */}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-gray-900 leading-none">
                      {user?.name}
                    </div>
                    <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mt-0.5">
                      {user?.role === 'ADMIN' ? 'ADMIN' : 'ENTRY'}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title="Logout"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-stone-900 hover:bg-black text-white rounded-xl shadow-2xs transition-all active:scale-95"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Admin Login
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 border-t border-gray-100 py-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200/80 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-800' : 'text-stone-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {isAuthenticated && (
            <div className="p-3 bg-amber-50/60 rounded-xl mb-3 border border-amber-200/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded mt-0.5">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Entry User'}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg bg-white"
              >
                Sign Out
              </button>
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white font-bold shadow-xs'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                setAccountsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-100 text-left transition-colors"
            >
              <CreditCard className="w-4 h-4 text-stone-600" />
              Manage Receiving Accounts
            </button>
          )}
        </div>
      )}

      {/* Admin Payment Accounts Management Modal */}
      <ManagePaymentAccountsModal
        isOpen={accountsModalOpen}
        onClose={() => setAccountsModalOpen(false)}
      />
    </header>
  );
}