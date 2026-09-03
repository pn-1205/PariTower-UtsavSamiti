export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Financial aggregates
    const depositAggregate = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: { deletedAt: null },
    });
    const totalReceived = depositAggregate._sum.amount || 0;

    const expenseAggregate = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { deletedAt: null },
    });
    const totalExpenses = expenseAggregate._sum.amount || 0;

    const currentBalance = totalReceived - totalExpenses;

    // 2. Flats stats (262 regular flats)
    const regularFlatsTotal = await prisma.flat.count({
      where: { isRefugee: false },
    });

    const contributedFlatsCount = await prisma.flat.count({
      where: {
        isRefugee: false,
        OR: [
          {
            contributors: {
              some: {
                deposits: { some: { deletedAt: null } },
              },
            },
          },
          {
            contributors: {
              some: {
                donations: { some: { deletedAt: null } },
              },
            },
          },
        ],
      },
    });

    const pendingFlatsCount = Math.max(0, regularFlatsTotal - contributedFlatsCount);

    // 3. Money breakdown
    const flatDepositsAggregate = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        deletedAt: null,
        contributor: { contributorType: 'flat' },
      },
    });
    const receivedFromFlats = flatDepositsAggregate._sum.amount || 0;

    const otherDepositsAggregate = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        deletedAt: null,
        contributor: { contributorType: 'other' },
      },
    });
    const receivedFromOther = otherDepositsAggregate._sum.amount || 0;

    // 4. Expenses by category
    const expenseCategoriesRaw = await prisma.expense.groupBy({
      by: ['expenseCategory'],
      _sum: { amount: true },
      where: { deletedAt: null },
      orderBy: { _sum: { amount: 'desc' } },
    });
    const expensesByCategory = expenseCategoriesRaw.map((e) => ({
      category: e.expenseCategory,
      amount: e._sum.amount || 0,
    }));

    // 5. In-kind counts & external contributors
    const foodDonationsCount = await prisma.donation.count({
      where: { deletedAt: null, donationType: 'Food' },
    });
    const otherDonationsCount = await prisma.donation.count({
      where: { deletedAt: null, donationType: 'Other' },
    });
    const externalContributorsCount = await prisma.contributor.count({
      where: { contributorType: 'other' },
    });

    // 6. Recent activity feed (recent 15 items: deposits, expenses, donations)
    const [recentDeposits, recentExpenses, recentDonations] = await Promise.all([
      prisma.deposit.findMany({
        where: { deletedAt: null },
        orderBy: { receivedDate: 'desc' },
        take: 8,
        include: {
          contributor: true,
          receivedByUser: { select: { id: true, name: true, username: true } },
          attachments: true,
        },
      }),
      prisma.expense.findMany({
        where: { deletedAt: null },
        orderBy: { expenseDate: 'desc' },
        take: 8,
        include: {
          enteredByUser: { select: { id: true, name: true, username: true } },
          attachments: true,
        },
      }),
      prisma.donation.findMany({
        where: { deletedAt: null },
        orderBy: { donationDate: 'desc' },
        take: 8,
        include: {
          contributor: true,
          receivedByUser: { select: { id: true, name: true, username: true } },
          attachments: true,
        },
      }),
    ]);

    const activity = [
      ...recentDeposits.map((d) => ({
        id: d.id,
        kind: 'deposit' as const,
        amount: d.amount,
        title: d.contributor.name,
        subtitle: `Received by ${d.receivedByUser.name}`,
        paymentMethod: d.paymentMethod,
        date: d.receivedDate,
        notes: d.notes,
        attachments: d.attachments,
      })),
      ...recentExpenses.map((e) => ({
        id: e.id,
        kind: 'expense' as const,
        amount: e.amount,
        title: e.paidTo,
        subtitle: `${e.expenseCategory} • Entered by ${e.enteredByUser.name}`,
        paymentMethod: e.paymentMethod,
        date: e.expenseDate,
        notes: e.description,
        attachments: e.attachments,
      })),
      ...recentDonations.map((dn) => ({
        id: dn.id,
        kind: 'donation' as const,
        amount: null,
        title: `${dn.quantity} ${dn.unit} ${dn.itemName}`,
        subtitle: `${dn.contributor.name} • Received by ${dn.receivedByUser.name}`,
        paymentMethod: dn.donationType,
        date: dn.donationDate,
        notes: dn.description || dn.notes,
        attachments: dn.attachments,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

    return NextResponse.json({
      totalReceived,
      totalExpenses,
      currentBalance,
      regularFlatsTotal,
      contributedFlatsCount,
      pendingFlatsCount,
      receivedFromFlats,
      receivedFromOther,
      expensesByCategory,
      foodDonationsCount,
      otherDonationCount: otherDonationsCount,
      externalContributorsCount,
      recentActivity: activity,
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data.' },
      { status: 500 }
    );
  }
}