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
    const { expenseCategory, description, amount, paymentMethod, paidTo, expenseDate, notes, attachment } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
    }

    const updateData: any = {
      expenseCategory,
      description: description?.trim(),
      amount: parsedAmount,
      paymentMethod,
      paidTo: paidTo?.trim(),
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      notes: notes !== undefined ? notes?.trim() : undefined,
    };

    if (attachment) {
      await prisma.attachment.create({
        data: {
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          uploadedByUserId: user.id,
          expenseId: params.id,
        },
      });
    }

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        enteredByUser: { select: { id: true, name: true, username: true } },
        attachments: true,
      },
    });

    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Expense PUT error:', error);
    return NextResponse.json({ error: 'Failed to update expense.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    // Soft delete
    await prisma.expense.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Expense DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete expense.' }, { status: 500 });
  }
}