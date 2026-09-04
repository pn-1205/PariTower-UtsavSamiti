export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const accounts = await prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    // Calculate balances for each account
    const accountsWithBalances = await Promise.all(
      accounts.map(async (acc) => {
        const depositsAgg = await prisma.deposit.aggregate({
          where: {
            paymentAccountId: acc.id,
            status: 'VERIFIED',
            deletedAt: null,
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        const expensesAgg = await prisma.expense.aggregate({
          where: {
            paymentAccountId: acc.id,
            deletedAt: null,
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        const inflow = depositsAgg._sum.amount || 0;
        const outflow = expensesAgg._sum.amount || 0;
        const balance = inflow - outflow;

        return {
          ...acc,
          totalInflow: inflow,
          totalOutflow: outflow,
          currentBalance: balance,
          depositsCount: depositsAgg._count.id || 0,
          expensesCount: expensesAgg._count.id || 0,
        };
      })
    );

    return NextResponse.json({ accounts: accountsWithBalances });
  } catch (error: any) {
    console.error('Error fetching payment accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch payment accounts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, accountType = 'UPI_BANK', upiId, phone, bankName, accountNumber, isDefault } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Account holder name is required.' }, { status: 400 });
    }

    if (accountType === 'UPI_BANK' && (!upiId || !upiId.trim())) {
      return NextResponse.json({ error: 'UPI ID is required for UPI/Bank accounts.' }, { status: 400 });
    }

    // If marked as default, unset other defaults
    if (isDefault) {
      await prisma.paymentAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await prisma.paymentAccount.create({
      data: {
        name: name.trim(),
        accountType,
        upiId: upiId?.trim() || null,
        phone: phone?.trim() || null,
        bankName: bankName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        isDefault: Boolean(isDefault),
        isActive: true,
      },
    });

    return NextResponse.json({ account });
  } catch (error: any) {
    console.error('Error creating payment account:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment account.' }, { status: 500 });
  }
}