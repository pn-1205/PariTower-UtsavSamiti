'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { formatCurrency, downloadCsv } from '@/lib/utils';
import {
  FileText,
  Download,
  Building2,
  TrendingDown,
  DollarSign,
  Users,
  PieChart,
  Scale,
  Gift,
  CheckCircle2,
} from 'lucide-react';

export default function ReportsPage() {
  const { refreshTrigger } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-gray-200 rounded-2xl"></div>
          <div className="h-28 bg-gray-200 rounded-2xl"></div>
          <div className="h-28 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const {
    summary = {},
    floorReport = [],
    paymentMethods = [],
    sourceBreakdown = {},
    expensesByCategory = [],
    expensesByVendor = [],
    donations = {},
    userActivity = [],
  } = data;

  const exportFloorReportCsv = () => {
    const headers = ['Floor', 'Total Flats', 'Contributed Flats', 'Pending Flats', 'Money Collected (INR)', 'Collection %'];
    const rows = floorReport.map((f: any) => [
      `Floor ${f.floor}`,
      f.totalFlats,
      f.contributed,
      f.pending,
      f.collectedAmount,
      `${f.percentage}%`,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    downloadCsv('ptfc_floor_collection_report.csv', csv);
  };

  const exportUserActivityCsv = () => {
    const headers = ['Member Name', 'Username', 'Role', 'Deposits Handled', 'Total Money Received (INR)', 'Expenses Entered', 'Total Expenses Paid (INR)', 'Donations Handled'];
    const rows = userActivity.map((u: any) => [
      `"${u.name}"`,
      u.username,
      u.role,
      u.depositsEntered,
      u.depositsTotal,
      u.expensesEntered,
      u.expensesTotal,
      u.donationsEntered,
    ]);
    const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    downloadCsv('ptfc_user_activity_report.csv', csv);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-rose-900" />
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Festival Reports & Analytics</h1>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Comprehensive breakdown of collections, expenses, floor performance, and committee activity.
        </p>
      </div>

      {/* 1. FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Received</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
            {formatCurrency(summary.totalReceived)}
          </p>
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            <p>From Flats: {formatCurrency(sourceBreakdown.fromFlats)} ({sourceBreakdown.fromFlatsCount} tx)</p>
            <p>From External: {formatCurrency(sourceBreakdown.fromExternal)} ({sourceBreakdown.fromExternalCount} tx)</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Expenses</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-950 mt-1">
            {formatCurrency(summary.totalExpenses)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Across {expensesByCategory.length} festival expenditure categories
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white p-5 rounded-2xl shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-100 flex items-center gap-1.5">
            <Scale className="w-4 h-4" /> Current Net Balance
          </span>
          <p className="text-3xl font-black mt-1">{formatCurrency(summary.balance)}</p>
          <p className="text-xs text-orange-100 mt-2">
            Formula: Total Received − Total Expenses
          </p>
        </div>
      </div>

      {/* 2. FLOOR BY FLOOR COLLECTION REPORT (262 Regular Flats) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-rose-900" />
              Flat Collection by Floor (1 to 14)
            </h3>
            <p className="text-xs text-gray-500">
              Floors 1-7, 9-12, 14 have 19 flats each; Floors 8 and 13 have 17 regular flats each (262 total).
            </p>
          </div>
          <button
            onClick={exportFloorReportCsv}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl self-start sm:self-center"
          >
            <Download className="w-3.5 h-3.5 text-rose-900" />
            Export Floor CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Floor</th>
                <th className="py-2.5 px-3">Total Regular Flats</th>
                <th className="py-2.5 px-3">Contributed</th>
                <th className="py-2.5 px-3">Pending</th>
                <th className="py-2.5 px-3">Money Collected</th>
                <th className="py-2.5 px-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {floorReport.map((f: any) => (
                <tr key={f.floor} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-bold text-gray-900">
                    Floor {f.floor}
                    {f.floor === 8 || f.floor === 13 ? (
                      <span className="text-[10px] text-amber-700 block font-normal">(17 regular flats)</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 px-3 text-gray-700">{f.totalFlats}</td>
                  <td className="py-2.5 px-3 text-emerald-700 font-bold">{f.contributed}</td>
                  <td className="py-2.5 px-3 text-amber-700">{f.pending}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">
                    {formatCurrency(f.collectedAmount)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${f.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{f.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. PAYMENT METHODS & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            Money Received by Payment Method
          </h3>
          <div className="space-y-2.5">
            {paymentMethods.map((m: any) => (
              <div key={m.method} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-gray-900">{m.method}</span>
                  <span className="text-xs text-gray-400 block">{m.count} transactions</span>
                </div>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Expenses by Category
          </h3>
          <div className="space-y-2.5">
            {expensesByCategory.map((c: any) => (
              <div key={c.category} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-gray-900">{c.category}</span>
                  <span className="text-xs text-gray-400 block">{c.count} vouchers/bills</span>
                </div>
                <span className="text-base font-black text-rose-700">
                  {formatCurrency(c.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. USER ACTIVITY REPORT (Audit Integrity) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-900" />
              Committee User Activity Audit
            </h3>
            <p className="text-xs text-gray-500">
              Audit trails of financial entries recorded by committee administrators and entry users.
            </p>
          </div>
          <button
            onClick={exportUserActivityCsv}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl self-start sm:self-center"
          >
            <Download className="w-3.5 h-3.5 text-rose-900" />
            Export User Activity CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userActivity.map((u: any) => (
            <div key={u.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-gray-900">{u.name}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-rose-100 text-orange-800 rounded">
                  {u.role}
                </span>
              </div>
              <p className="text-xs text-gray-400">@{u.username}</p>

              <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Deposits Received:</span>
                  <span className="font-bold text-emerald-700">
                    {u.depositsEntered} ({formatCurrency(u.depositsTotal)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expenses Entered:</span>
                  <span className="font-bold text-rose-700">
                    {u.expensesEntered} ({formatCurrency(u.expensesTotal)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">In-Kind Donations:</span>
                  <span className="font-bold text-amber-700">{u.donationsEntered}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}