'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/transactions');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm font-bold text-stone-600">Redirecting to General Ledger...</p>
      </div>
    </div>
  );
}