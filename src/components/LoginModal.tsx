'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { X, Lock, AlertTriangle, KeyRound, User } from 'lucide-react';

export default function LoginModal() {
  const { loginModalOpen, setLoginModalOpen, login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!loginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-rose-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Admin & Committee Login</h3>
              <p className="text-xs text-amber-200">Pari Tower Utsav Samiti</p>
            </div>
          </div>
          <button
            onClick={() => setLoginModalOpen(false)}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner regarding initial development credentials */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Security Notice:</span> Initial default login is <code>admin / admin</code>. Please change credentials before production deployment.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:border-rose-800 focus:outline-none"
                placeholder="e.g. admin or rahul"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-800 focus:border-rose-800 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-bold rounded-xl shadow-md shadow-rose-950/20 transition-all disabled:opacity-50 text-sm active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          {/* Quick Demo Login Buttons */}
          <div className="pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-medium mb-2">Demo Accounts:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin', 'admin')}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Admin (admin)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('rahul', 'rahul123')}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Rahul (Entry User)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('amit', 'amit123')}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Amit (Entry User)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}