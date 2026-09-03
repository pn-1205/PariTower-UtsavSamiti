export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Calculate 2 months ago threshold
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Execute all independent database queries in parallel for ultra-low latency
    const [
      depositAggregate,
      expenseAggregate,
      regularFlatsTotal,
      contributedFlatsCount,
      flatDepositsAggregate,
      otherDepositsAggregate,
      expenseCategoriesRaw,
      foodDonationsCount,
      otherDonationsCount,
      externalContributorsCount,
      recentDeposits,
      recentExpenses,
      recentDonations,
    ] = await Promise.all([
      // 1. Total money received sum
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null },
      }),
      // 2. Total expenses sum
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null },
      }),
      // 3. Regular flats total
      prisma.flat.count({
        where: { isRefugee: false },
      }),
      // 4. Contributed flats count
      prisma.flat.count({
        where: {
          isRefugee: false,
          OR: [
            { contributors: { some: { deposits: { some: { deletedAt: null } } } } },
            { contributors: { some: { donations: { some: { deletedAt: null } } } } },
          ],
        },
      }),
      // 5. From flats sum
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, contributor: { contributorType: 'flat' } },
      }),
      // 6. From others sum
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, contributor: { contributorType: 'other' } },
      }),
      // 7. Expense categories
      prisma.expense.groupBy({
        by: ['expenseCategory'],
        _sum: { amount: true },
        where: { deletedAt: null },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      // 8. Food donations count
      prisma.donation.count({
        where: { deletedAt: null, donationType: 'Food' },
      }),
      // 9. Other donations count
      prisma.donation.count({
        where: { deletedAt: null, donationType: 'Other' },
      }),
      // 10. External contributors count
      prisma.contributor.count({
        where: { contributorType: 'other' },
      }),
      // 11. Deposits in last 2 months
      prisma.deposit.findMany({
        where: {
          deletedAt: null,
          receivedDate: { gte: twoMonthsAgo },
        },
        orderBy: { receivedDate: 'desc' },
        include: {
          contributor: true,
          receivedByUser: { select: { id: true, name: true, username: true } },
          attachments: true,
        },
      }),
      // 12. Expenses in last 2 months
      prisma.expense.findMany({
        where: {
          deletedAt: null,
          expenseDate: { gte: twoMonthsAgo },
        },
        orderBy: { expenseDate: 'desc' },
        include: {
          enteredByUser: { select: { id: true, name: true, username: true } },
          attachments: true,
        },
      }),
      // 13. Donations in last 2 months
      prisma.donation.findMany({
        where: {
          deletedAt: null,
          donationDate: { gte: twoMonthsAgo },
        },
        orderBy: { donationDate: 'desc' },
        include: {
          contributor: true,
          receivedByUser: { select: { id: true, name: true, username: true } },
          attachments: true,
        },
      }),
    ]);

    const totalReceived = depositAggregate._sum.amount || 0;
    const totalExpenses = expenseAggregate._sum.amount || 0;
    const currentBalance = totalReceived - totalExpenses;
    const pendingFlatsCount = Math.max(0, regularFlatsTotal - contributedFlatsCount);
    const receivedFromFlats = flatDepositsAggregate._sum.amount || 0;
    const receivedFromOther = otherDepositsAggregate._sum.amount || 0;

    const expensesByCategory = expenseCategoriesRaw.map((item) => ({
      category: item.expenseCategory,
      total: item._sum.amount || 0,
    }));

    // Merge all activities from last 2 months
    const activityList: any[] = [];

    recentDeposits.forEach((dep) => {
      activityList.push({
        id: `dep-${dep.id}`,
        type: 'deposit',
        date: dep.receivedDate,
        festival: dep.festival || 'Ganesh Festival',
        title: dep.donorName
          ? `${dep.donorName} (${dep.contributor.name})`
          : dep.contributor.name,
        amount: dep.amount,
        details: `${dep.paymentMethod} • Handled by ${dep.receivedByUser.name}`,
        notes: dep.notes,
        attachments: dep.attachments,
      });
    });

    recentExpenses.forEach((exp) => {
      activityList.push({
        id: `exp-${exp.id}`,
        type: 'expense',
        date: exp.expenseDate,
        festival: exp.festival || 'Ganesh Festival',
        title: exp.paidTo,
        amount: -exp.amount,
        details: `${exp.expenseCategory} • ${exp.paymentMethod} • By ${exp.enteredByUser.name}`,
        notes: exp.description,
        attachments: exp.attachments,
      });
    });

    recentDonations.forEach((don) => {
      activityList.push({
        id: `don-${don.id}`,
        type: 'donation',
        date: don.donationDate,
        festival: don.festival || 'Ganesh Festival',
        title: `${don.quantity} ${don.unit} ${don.itemName}`,
        amount: null,
        details: `${don.donationType} • From ${don.donorName || don.contributor.name}`,
        notes: don.description,
        attachments: don.attachments,
      });
    });

    activityList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentActivity = activityList;

    return NextResponse.json(
      {
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
        recentActivity,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=1, stale-while-revalidate=5',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}