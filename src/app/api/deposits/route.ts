export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getFyDateRange } from '@/lib/festivalUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const methodParam = searchParams.get('method');
    const typeParam = searchParams.get('type'); // 'flat' or 'other'
    const searchParam = searchParams.get('search');
    const flatIdParam = searchParams.get('flatId');
    const festivalParam = searchParams.get('festival');
    const fyParam = searchParams.get('fy');

    const where: any = {
      deletedAt: null,
    };

    if (festivalParam && festivalParam !== 'all') {
      where.festival = festivalParam;
    }

    if (fyParam && fyParam !== 'all') {
      const { start, end } = getFyDateRange(fyParam);
      if (start && end) {
        where.receivedDate = { gte: start, lte: end };
      }
    }

    if (methodParam && methodParam !== 'all') {
      where.paymentMethod = methodParam;
    }

    if (typeParam && typeParam !== 'all') {
      where.contributor = { ...where.contributor, contributorType: typeParam };
    }

    if (flatIdParam) {
      where.contributor = { ...where.contributor, flatId: flatIdParam };
    }

    if (searchParam) {
      const q = searchParam.trim();
      where.OR = [
        { donorName: { contains: q } },
        { contributor: { name: { contains: q } } },
        { notes: { contains: q } },
        { paymentMethod: { contains: q } },
        { receivedByUser: { name: { contains: q } } },
      ];
    }

    const deposits = await prisma.deposit.findMany({
      where,
      orderBy: { receivedDate: 'desc' },
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

    return NextResponse.json({ deposits });
  } catch (error: any) {
    console.error('Deposits GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch deposits.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    let {
      festival,
      contributorId,
      contributorName,
      contributorCategory,
      contributorPhone,
      donorName,
      amount,
      paymentMethod,
      receivedDate,
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
      return NextResponse.json({ error: 'Received From (Contributor / Flat) is required.' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required.' }, { status: 400 });
    }

    const dateVal = receivedDate ? new Date(receivedDate) : new Date();

    const deposit = await prisma.deposit.create({
      data: {
        festival: festival?.trim() || 'Ganesh Festival',
        contributorId,
        donorName: cleanDonorName,
        amount: parsedAmount,
        paymentMethod,
        receivedDate: dateVal,
        receivedByUserId: user.id,
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

    return NextResponse.json({ success: true, deposit });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please login to add deposits.' }, { status: 401 });
    }
    console.error('Deposit POST error:', error);
    return NextResponse.json({ error: 'Failed to record deposit.' }, { status: 500 });
  }
}