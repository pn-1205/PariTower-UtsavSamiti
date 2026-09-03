import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { amount, paymentMethod, receivedDate, notes, attachment } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
    }

    const updateData: any = {
      amount: parsedAmount,
      paymentMethod,
      receivedDate: receivedDate ? new Date(receivedDate) : undefined,
      notes: notes !== undefined ? notes?.trim() : undefined,
    };

    if (attachment) {
      // Add new attachment
      await prisma.attachment.create({
        data: {
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          uploadedByUserId: user.id,
          depositId: params.id,
        },
      });
    }

    const updated = await prisma.deposit.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contributor: true,
        receivedByUser: { select: { id: true, name: true, username: true } },
        attachments: true,
      },
    });

    return NextResponse.json({ success: true, deposit: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Deposit PUT error:', error);
    return NextResponse.json({ error: 'Failed to update deposit.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    // Soft delete
    await prisma.deposit.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Deposit DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete deposit.' }, { status: 500 });
  }
}