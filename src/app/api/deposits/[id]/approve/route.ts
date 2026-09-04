export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const existing = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Deposit record not found.' }, { status: 404 });
    }

    if (existing.status === 'VERIFIED') {
      return NextResponse.json({ message: 'Deposit is already verified.', deposit: existing });
    }

    const updated = await prisma.deposit.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        receivedByUserId: user.id,
      },
      include: {
        contributor: {
          include: { flat: true },
        },
        receivedByUser: { select: { id: true, name: true } },
        paymentAccount: true,
      },
    });

    return NextResponse.json({
      success: true,
      deposit: updated,
      message: 'Deposit approved and published to the General Ledger.',
    });
  } catch (error: any) {
    console.error('Error approving deposit:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve deposit.' }, { status: 500 });
  }
}