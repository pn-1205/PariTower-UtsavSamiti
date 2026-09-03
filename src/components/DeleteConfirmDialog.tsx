'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  itemDetails: {
    amount?: number;
    party: string;
    date: string;
    description?: string;
  };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmDialog({
  open,
  title,
  itemDetails,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-red-100">
        <div className="p-5 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>

          <div className="my-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1 text-left">
            {itemDetails.amount !== undefined && (
              <div className="text-base font-bold text-gray-900">
                {formatCurrency(itemDetails.amount)}
              </div>
            )}
            <div className="font-medium text-gray-800">{itemDetails.party}</div>
            {itemDetails.description && <div>{itemDetails.description}</div>}
            <div className="text-gray-400">{itemDetails.date}</div>
          </div>

          <p className="text-xs text-red-600 font-medium mb-4">
            This will remove this record from financial totals and reports.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm shadow-red-600/20 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}