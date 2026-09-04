import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  const lines = phone.split(/[\n,]+/);
  return lines
    .map((num) => {
      const trimmed = num.trim().replace(/\s+/g, '');
      if (trimmed.length <= 5) return trimmed;
      const visible = trimmed.slice(0, 5);
      return `${visible}*****`;
    })
    .join(', ');
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Decorations',
  'Sound System',
  'Venue',
  'Printing',
  'Transportation',
  'Materials',
  'Entertainment',
  'Utilities',
  'Volunteer/Staff',
  'Miscellaneous',
  'Other',
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Other',
] as const;

export const DONATION_TYPES = [
  'Food',
  'Other',
] as const;

export const CONTRIBUTOR_CATEGORIES = [
  'Resident',
  'Guest',
  'Relative/Friend',
  'Sponsor',
  'Business/Shop',
  'Organization',
  'Anonymous',
  'Other',
] as const;