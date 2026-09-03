export const DEFAULT_FESTIVALS = [
  'Ganesh Festival',
  'Navratri Festival',
  'Diwali Celebration',
  'Holi Celebration',
  'Dahi Handi',
  'General / Society Events',
];

export const FESTIVAL_OPTIONS = DEFAULT_FESTIVALS;

export type FestivalName = string;

export const FY_OPTIONS = [
  { label: 'FY 2026-27 (Current)', value: '2026-27' },
  { label: 'FY 2025-26', value: '2025-26' },
  { label: 'FY 2024-25', value: '2024-25' },
  { label: 'All Financial Years', value: 'all' },
] as const;

export function getFyDateRange(fyValue: string): { start?: Date; end?: Date } {
  if (!fyValue || fyValue === 'all') {
    return {};
  }
  const parts = fyValue.split('-');
  if (parts.length === 2) {
    const startYear = parseInt(parts[0], 10);
    if (!isNaN(startYear)) {
      const start = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0)); // April 1
      const end = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999)); // March 31
      return { start, end };
    }
  }
  return {};
}

export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (3 = April)
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}