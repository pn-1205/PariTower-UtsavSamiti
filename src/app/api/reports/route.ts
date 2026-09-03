export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Overall Summary
    const [depAgg, expAgg] = await Promise.all([
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null },
      }),
    ]);
    const totalReceived = depAgg._sum.amount || 0;
    const totalExpenses = expAgg._sum.amount || 0;
    const balance = totalReceived - totalExpenses;

    // 2. Floor by Floor Collection (1 to 14)
    const regularFlats = await prisma.flat.findMany({
      where: { isRefugee: false },
      include: {
        contributors: {
          include: {
            deposits: {
              where: { deletedAt: null },
              select: { amount: true },
            },
            donations: {
              where: { deletedAt: null },
              select: { id: true },
            },
          },
        },
      },
    });

    const floorStats: Record<number, {
      floor: number;
      totalFlats: number;
      contributed: number;
      pending: number;
      collectedAmount: number;
      percentage: number;
    }> = {};

    for (let f = 1; f <= 14; f++) {
      floorStats[f] = {
        floor: f,
        totalFlats: 0,
        contributed: 0,
        pending: 0,
        collectedAmount: 0,
        percentage: 0,
      };
    }

    for (const flat of regularFlats) {
      const st = floorStats[flat.floor];
      if (!st) continue;
      st.totalFlats++;

      let flatMoney = 0;
      let hasDonation = false;

      for (const c of flat.contributors) {
        for (const d of c.deposits) {
          flatMoney += d.amount;
        }
        if (c.donations.length > 0) {
          hasDonation = true;
        }
      }

      st.collectedAmount += flatMoney;
      if (flatMoney > 0 || hasDonation) {
        st.contributed++;
      }
    }

    const floorReport = Object.values(floorStats).map((st) => {
      st.pending = Math.max(0, st.totalFlats - st.contributed);
      st.percentage = st.totalFlats > 0 ? Math.round((st.contributed / st.totalFlats) * 100) : 0;
      return st;
    });

    // 3. Payment Method breakdown
    const depositsByMethod = await prisma.deposit.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
      _count: { id: true },
      where: { deletedAt: null },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // 4. Source breakdown (Flats vs External)
    const [flatDeposits, otherDeposits] = await Promise.all([
      prisma.deposit.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { deletedAt: null, contributor: { contributorType: 'flat' } },
      }),
      prisma.deposit.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { deletedAt: null, contributor: { contributorType: 'other' } },
      }),
    ]);

    // 5. Expenses by Category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['expenseCategory'],
      _sum: { amount: true },
      _count: { id: true },
      where: { deletedAt: null },
      orderBy: { _sum: { amount: 'desc' } },
    });

    // 6. Expenses by Vendor
    const expensesByVendor = await prisma.expense.groupBy({
      by: ['paidTo'],
      _sum: { amount: true },
      _count: { id: true },
      where: { deletedAt: null },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    // 7. Donations Summary
    const donationsRaw = await prisma.donation.findMany({
      where: { deletedAt: null },
      select: { donationType: true, estimatedValue: true, quantity: true, unit: true, itemName: true },
    });
    let totalEstimatedDonationValue = 0;
    let foodDonationCount = 0;
    let otherDonationCount = 0;
    for (const d of donationsRaw) {
      if (d.donationType === 'Food') foodDonationCount++;
      else otherDonationCount++;
      if (d.estimatedValue) totalEstimatedDonationValue += d.estimatedValue;
    }

    // 8. User Activity
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        depositsReceived: {
          where: { deletedAt: null },
          select: { amount: true },
        },
        expensesEntered: {
          where: { deletedAt: null },
          select: { amount: true },
        },
        donationsReceived: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    const userActivity = users.map((u) => {
      const depositsEntered = u.depositsReceived.length;
      const depositsTotal = u.depositsReceived.reduce((acc, curr) => acc + curr.amount, 0);
      const expensesEntered = u.expensesEntered.length;
      const expensesTotal = u.expensesEntered.reduce((acc, curr) => acc + curr.amount, 0);
      const donationsEntered = u.donationsReceived.length;

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        depositsEntered,
        depositsTotal,
        expensesEntered,
        expensesTotal,
        donationsEntered,
      };
    });

    return NextResponse.json({
      summary: {
        totalReceived,
        totalExpenses,
        balance,
      },
      floorReport,
      paymentMethods: depositsByMethod.map((m) => ({
        method: m.paymentMethod,
        amount: m._sum.amount || 0,
        count: m._count.id,
      })),
      sourceBreakdown: {
        fromFlats: flatDeposits._sum.amount || 0,
        fromFlatsCount: flatDeposits._count.id,
        fromExternal: otherDeposits._sum.amount || 0,
        fromExternalCount: otherDeposits._count.id,
      },
      expensesByCategory: expensesByCategory.map((c) => ({
        category: c.expenseCategory,
        amount: c._sum.amount || 0,
        count: c._count.id,
      })),
      expensesByVendor: expensesByVendor.map((v) => ({
        vendor: v.paidTo,
        amount: v._sum.amount || 0,
        count: v._count.id,
      })),
      donations: {
        foodCount: foodDonationCount,
        otherCount: otherDonationCount,
        totalEstimatedValue: totalEstimatedDonationValue,
      },
      userActivity,
    });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to generate reports.' }, { status: 500 });
  }
}