'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'ENTRY_USER' | string;
}

export interface AttachmentItem {
  id?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEntryUser: boolean;

  // Global Modals State
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  addDepositModalOpen: boolean;
  setAddDepositModalOpen: (open: boolean) => void;
  addExpenseModalOpen: boolean;
  setAddExpenseModalOpen: (open: boolean) => void;
  addDonationModalOpen: boolean;
  setAddDonationModalOpen: (open: boolean) => void;
  lightboxAttachment: AttachmentItem | null;
  setLightboxAttachment: (att: AttachmentItem | null) => void;
  
  // Refresh trigger for components to re-fetch data
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [addDepositModalOpen, setAddDepositModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [addDonationModalOpen, setAddDonationModalOpen] = useState(false);
  const [lightboxAttachment, setLightboxAttachment] = useState<AttachmentItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }
      setUser(data.user);
      setLoginModalOpen(false);
      triggerRefresh();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error during login.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      triggerRefresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isEntryUser = user?.role === 'ENTRY_USER';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
        isAuthenticated,
        isAdmin,
        isEntryUser,
        loginModalOpen,
        setLoginModalOpen,
        addDepositModalOpen,
        setAddDepositModalOpen,
        addExpenseModalOpen,
        setAddExpenseModalOpen,
        addDonationModalOpen,
        setAddDonationModalOpen,
        lightboxAttachment,
        setLightboxAttachment,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}