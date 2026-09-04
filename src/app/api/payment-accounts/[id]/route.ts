export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { id } = params;
    const body = await request.json();
    const { name, upiId, phone, bankName, accountNumber, isDefault, isActive } = body;

    if (isDefault) {
      // Unset previous defaults
      await prisma.paymentAccount.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.paymentAccount.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(upiId !== undefined && { upiId: upiId?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(bankName !== undefined && { bankName: bankName?.trim() || null }),
        ...(accountNumber !== undefined && { accountNumber: accountNumber?.trim() || null }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ account: updated });
  } catch (error: any) {
    console.error('Error updating payment account:', error);
    return NextResponse.json({ error: error.message || 'Failed to update payment account.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const { id } = params;

    // Check count of active accounts
    const activeCount = await prisma.paymentAccount.count({
      where: { isActive: true },
    });

    if (activeCount <= 1) {
      return NextResponse.json({ error: 'Cannot deactivate the only active payment account.' }, { status: 400 });
    }

    // Soft deactivate
    const updated = await prisma.paymentAccount.update({
      where: { id },
      data: { isActive: false, isDefault: false },
    });

    // If this was default, pick another active account as default
    const hasDefault = await prisma.paymentAccount.findFirst({
      where: { isActive: true, isDefault: true },
    });

    if (!hasDefault) {
      const firstActive = await prisma.paymentAccount.findFirst({
        where: { isActive: true },
      });
      if (firstActive) {
        await prisma.paymentAccount.update({
          where: { id: firstActive.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true, account: updated });
  } catch (error: any) {
    console.error('Error deleting payment account:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete payment account.' }, { status: 500 });
  }
}