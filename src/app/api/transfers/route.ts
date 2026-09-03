export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ensureFestivalRegistered } from '@/lib/festivalServer';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    let { fromFestival, toFestival, amount, transferDate, notes } = body;

    if (!fromFestival || !toFestival) {
      return NextResponse.json(
        { error: 'Both Source and Destination festivals are required.' },
        { status: 400 }
      );
    }

    fromFestival = await ensureFestivalRegistered(fromFestival);
    toFestival = await ensureFestivalRegistered(toFestival);

    if (fromFestival === toFestival) {
      return NextResponse.json(
        { error: 'Source and Destination festivals must be different.' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Transfer amount must be greater than 0.' },
        { status: 400 }
      );
    }

    const dateVal = transferDate ? new Date(transferDate) : new Date();

    // 1. Ensure internal treasury contributor exists for incoming deposit
    let transferContributor = await prisma.contributor.findFirst({
      where: { contributorType: 'other', name: 'Internal Festival Treasury' },
    });

    if (!transferContributor) {
      transferContributor = await prisma.contributor.create({
        data: {
          contributorType: 'other',
          name: 'Internal Festival Treasury',
          category: 'Internal',
          notes: 'Special system account for internal inter-festival fund transfers',
        },
      });
    }

    // 2. Atomic double-entry transfer using transaction
    const [outgoingExpense, incomingDeposit] = await prisma.$transaction([
      // Outgoing expense from source festival
      prisma.expense.create({
        data: {
          festival: fromFestival,
          expenseCategory: 'Fund Transfer',
          paidTo: `${toFestival} Fund`,
          description: `Inter-festival transfer to ${toFestival}`,
          amount: parsedAmount,
          paymentMethod: 'Internal Transfer',
          expenseDate: dateVal,
          enteredByUserId: user.id,
          notes: notes ? `Transfer Note: ${notes}` : `Surplus transfer from ${fromFestival} to ${toFestival}`,
        },
      }),
      // Incoming deposit into destination festival
      prisma.deposit.create({
        data: {
          festival: toFestival,
          contributorId: transferContributor.id,
          donorName: `Fund Transfer from ${fromFestival}`,
          amount: parsedAmount,
          paymentMethod: 'Internal Transfer',
          receivedDate: dateVal,
          receivedByUserId: user.id,
          notes: notes ? `Transfer Note: ${notes}` : `Surplus allocation received from ${fromFestival}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ₹${parsedAmount.toLocaleString('en-IN')} from ${fromFestival} to ${toFestival}.`,
      outgoingExpense,
      incomingDeposit,
    });
  } catch (error: any) {
    console.error('Transfer API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete fund transfer.' },
      { status: 500 }
    );
  }
}