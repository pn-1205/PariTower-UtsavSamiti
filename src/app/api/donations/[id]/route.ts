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
    const { donationType, itemName, quantity, unit, estimatedValue, donationDate, description, notes, attachment } = body;

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0.' }, { status: 400 });
    }

    const updateData: any = {
      donationType,
      itemName: itemName?.trim(),
      quantity: parsedQty,
      unit: unit?.trim(),
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
      donationDate: donationDate ? new Date(donationDate) : undefined,
      description: description !== undefined ? description?.trim() : undefined,
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
          donationId: params.id,
        },
      });
    }

    const updated = await prisma.donation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contributor: true,
        receivedByUser: { select: { id: true, name: true, username: true } },
        attachments: true,
      },
    });

    return NextResponse.json({ success: true, donation: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Donation PUT error:', error);
    return NextResponse.json({ error: 'Failed to update donation.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    // Soft delete
    await prisma.donation.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Donation DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete donation.' }, { status: 500 });
  }
}