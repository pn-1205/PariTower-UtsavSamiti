'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import {
  DollarSign,
  TrendingDown,
  FileText,
  PlusCircle,
  LogOut,
  Lock,
  Gift,
  Home,
  Users,
  Search,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout, setLoginModalOpen, setAddDepositModalOpen, setAddExpenseModalOpen, setAddDonationModalOpen } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Money Received', href: '/deposits', icon: DollarSign },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Donations', href: '/donations', icon: Gift },
    { name: 'Ledger', href: '/transactions', icon: BookOpen },
    { name: 'Reports', href: '/reports', icon: FileText },
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              PTFC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base sm:text-lg leading-tight tracking-tight">
                  Pari Tower
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                  Festival Committee
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                Pari Tower Festival Committee
              </p>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-xs mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search flat, donor, vendor..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Action: Auth & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Add Actions Desktop Buttons */}
                <div className="hidden sm:flex items-center gap-1.5">
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
                    <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm shadow-orange-600/20 transition-all active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
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
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
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
            <div className="p-3 bg-orange-50 rounded-xl mb-3 border border-orange-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-orange-200 text-orange-800 rounded mt-0.5">
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
                    ? 'bg-orange-500 text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Global Quick Search Dropdown / Overlay */}
      {searchOpen && (
        <div className="border-t border-gray-200 bg-white p-4 shadow-xl">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Search Results for "{searchQuery}"
              </span>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium"
              >
                Close
              </button>
            </div>

            {searching && (
              <div className="py-6 text-center text-sm text-gray-500">Searching records...</div>
            )}

            {!searching && searchResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.flats?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Flats</h4>
                    <div className="space-y-1">
                      {searchResults.flats.map((f: any) => {
                        const num = f.altName || f.displayName.replace('-', '');
                        return (
                          <Link
                            key={f.id}
                            href={`/deposits?search=${encodeURIComponent(num)}`}
                            onClick={() => setSearchOpen(false)}
                            className="block p-2 rounded-lg hover:bg-orange-50 transition-colors border border-gray-100"
                          >
                            <div className="font-bold text-sm text-gray-900">Flat {num}</div>
                            <div className="text-xs text-gray-500">Click to view deposits in ledger</div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResults.deposits?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">Deposits</h4>
                    <div className="space-y-1">
                      {searchResults.deposits.map((d: any) => (
                        <div key={d.id} className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                          <div className="flex justify-between text-sm font-bold text-emerald-900">
                            <span>{d.contributorName}</span>
                            <span>₹{d.amount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-xs text-emerald-700">
                            {d.paymentMethod} • Received by {d.user}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.expenses?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-rose-700 uppercase mb-2">Expenses</h4>
                    <div className="space-y-1">
                      {searchResults.expenses.map((e: any) => (
                        <div key={e.id} className="p-2 rounded-lg bg-rose-50/60 border border-rose-100">
                          <div className="flex justify-between text-sm font-bold text-rose-900">
                            <span>{e.paidTo}</span>
                            <span>₹{e.amount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-xs text-rose-700">
                            {e.category} • {e.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}