export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'Food', 'Other'
    const searchParam = searchParams.get('search');

    const where: any = {
      deletedAt: null,
    };

    if (typeParam && typeParam !== 'all') {
      where.donationType = typeParam;
    }

    if (searchParam) {
      const q = searchParam.trim();
      where.OR = [
        { donorName: { contains: q } },
        { itemName: { contains: q } },
        { description: { contains: q } },
        { contributor: { name: { contains: q } } },
        { receivedByUser: { name: { contains: q } } },
      ];
    }

    const donations = await prisma.donation.findMany({
      where,
      orderBy: { donationDate: 'desc' },
      include: {
        contributor: {
          include: {
            flat: { select: { id: true, floor: true, flatNumber: true, displayName: true, altName: true } },
          },
        },
        receivedByUser: {
          select: { id: true, name: true, username: true, role: true },
        },
        attachments: true,
      },
    });

    return NextResponse.json({ donations });
  } catch (error: any) {
    console.error('Donations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch donations.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    let {
      contributorId,
      contributorName,
      contributorCategory,
      contributorPhone,
      donorName,
      donationType,
      itemName,
      quantity,
      unit,
      estimatedValue,
      donationDate,
      description,
      notes,
      attachment,
    } = body;

    // Compulsory donor name check
    if (!donorName || !donorName.trim()) {
      return NextResponse.json({ error: 'Name of the Donor is compulsory.' }, { status: 400 });
    }
    const cleanDonorName = donorName.trim();

    // Dynamic external contributor support
    if (!contributorId && contributorName && contributorName.trim()) {
      const cleanName = contributorName.trim();
      let existing = await prisma.contributor.findFirst({
        where: {
          contributorType: 'other',
          name: { equals: cleanName },
        },
      });

      if (!existing) {
        existing = await prisma.contributor.create({
          data: {
            contributorType: 'other',
            name: cleanName,
            category: contributorCategory || 'Guest',
            phone: contributorPhone?.trim() || null,
          },
        });
      }
      contributorId = existing.id;
    }

    if (!contributorId) {
      return NextResponse.json({ error: 'Contributor / Flat is required.' }, { status: 400 });
    }

    if (!donationType) {
      return NextResponse.json({ error: 'Donation Type is required.' }, { status: 400 });
    }

    if (!itemName || !itemName.trim()) {
      return NextResponse.json({ error: 'Item Name is required.' }, { status: 400 });
    }

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0.' }, { status: 400 });
    }

    if (!unit || !unit.trim()) {
      return NextResponse.json({ error: 'Unit is required (e.g. kg, boxes, packets).' }, { status: 400 });
    }

    const parsedEst = estimatedValue ? parseFloat(estimatedValue) : null;
    const dateVal = donationDate ? new Date(donationDate) : new Date();

    const donation = await prisma.donation.create({
      data: {
        contributorId,
        donorName: cleanDonorName,
        donationType,
        itemName: itemName.trim(),
        quantity: parsedQty,
        unit: unit.trim(),
        estimatedValue: parsedEst,
        donationDate: dateVal,
        receivedByUserId: user.id,
        description: description?.trim() || null,
        notes: notes?.trim() || null,
        attachments: attachment
          ? {
              create: {
                fileName: attachment.fileName,
                filePath: attachment.filePath,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
                uploadedByUserId: user.id,
              },
            }
          : undefined,
      },
      include: {
        contributor: {
          include: {
            flat: true,
          },
        },
        receivedByUser: { select: { id: true, name: true, username: true } },
        attachments: true,
      },
    });

    return NextResponse.json({ success: true, donation });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please login to add donations.' }, { status: 401 });
    }
    console.error('Donation POST error:', error);
    return NextResponse.json({ error: 'Failed to record donation.' }, { status: 500 });
  }
}