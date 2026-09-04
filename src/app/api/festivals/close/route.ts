export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    let user;
    try {
      user = await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Only administrators can close and freeze festival ledgers.' }, { status: 403 });
    }

    const body = await request.json();
    const { festivalName, nextFestivalName, notes } = body;

    if (!festivalName || typeof festivalName !== 'string' || !festivalName.trim()) {
      return NextResponse.json({ error: 'Current festival name to close is required.' }, { status: 400 });
    }

    const cleanFestName = festivalName.trim();
    const closeDate = new Date();

    // 1. Find or create the festival being closed
    let currentFestival = await prisma.festival.findFirst({
      where: { name: { equals: cleanFestName } },
    });

    if (!currentFestival) {
      currentFestival = await prisma.festival.create({
        data: {
          name: cleanFestName,
          status: 'ACTIVE',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          openingBalance: 0,
        },
      });
    }

    if (currentFestival.status === 'CLOSED') {
      return NextResponse.json({ error: `Festival '${cleanFestName}' is already closed and frozen.` }, { status: 400 });
    }

    const start = currentFestival.startDate || new Date(0);

    // 2. Compute audited totals for this festival period
    const depositAgg = await prisma.deposit.aggregate({
      _sum: { amount: true },
      where: {
        deletedAt: null,
        status: 'VERIFIED',
        OR: [
          { festival: cleanFestName },
          { receivedDate: { gte: start, lte: closeDate } },
        ],
      },
    });

    const expenseAgg = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        deletedAt: null,
        OR: [
          { festival: cleanFestName },
          { expenseDate: { gte: start, lte: closeDate } },
        ],
      },
    });

    const openingBal = currentFestival.openingBalance || 0;
    const totalDonations = depositAgg._sum.amount || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;
    const closingBalance = openingBal + totalDonations - totalExpenses;

    // 3. Mark current festival as CLOSED & FROZEN
    const updatedClosedFestival = await prisma.festival.update({
      where: { id: currentFestival.id },
      data: {
        status: 'CLOSED',
        closedAt: closeDate,
        endDate: closeDate,
        closedByUserId: user.id,
        totalDonations,
        totalExpenses,
        closingBalance,
        notes: notes ? notes.trim() : null,
      },
    });

    // 4. Open the new active festival (if specified)
    let newActiveFestival = null;
    if (nextFestivalName && typeof nextFestivalName === 'string' && nextFestivalName.trim()) {
      const cleanNextName = nextFestivalName.trim();

      const existingNext = await prisma.festival.findFirst({
        where: { name: { equals: cleanNextName } },
      });

      if (existingNext) {
        newActiveFestival = await prisma.festival.update({
          where: { id: existingNext.id },
          data: {
            status: 'ACTIVE',
            startDate: closeDate,
            openingBalance: closingBalance, // Balance carried forward
            closedAt: null,
            closingBalance: null,
          },
        });
      } else {
        newActiveFestival = await prisma.festival.create({
          data: {
            name: cleanNextName,
            status: 'ACTIVE',
            startDate: closeDate,
            openingBalance: closingBalance, // Balance carried forward
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Festival '${cleanFestName}' successfully closed and frozen.`,
      closedFestival: updatedClosedFestival,
      newFestival: newActiveFestival,
    });
  } catch (error: any) {
    console.error('Error closing festival ledger:', error);
    return NextResponse.json({ error: error.message || 'Failed to close festival ledger.' }, { status: 500 });
  }
}
