export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getFyDateRange } from '@/lib/festivalUtils';
import { ensureFestivalRegistered } from '@/lib/festivalServer';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const methodParam = searchParams.get('method');
    const searchParam = searchParams.get('search');
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
        where.expenseDate = { gte: start, lte: end };
      }
    }

    if (categoryParam && categoryParam !== 'all') {
      where.expenseCategory = categoryParam;
    }

    if (methodParam && methodParam !== 'all') {
      where.paymentMethod = methodParam;
    }

    if (searchParam) {
      const q = searchParam.trim();
      where.OR = [
        { paidTo: { contains: q } },
        { description: { contains: q } },
        { notes: { contains: q } },
        { expenseCategory: { contains: q } },
        { enteredByUser: { name: { contains: q } } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: {
        enteredByUser: {
          select: { id: true, name: true, username: true, role: true },
        },
        attachments: true,
      },
    });

    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error('Expenses GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { festival, expenseCategory, description, amount, paymentMethod, paidTo, expenseDate, notes, attachment } = body;

    if (!expenseCategory) {
      return NextResponse.json({ error: 'Expense Category is required.' }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0.' }, { status: 400 });
    }

    if (!paidTo || !paidTo.trim()) {
      return NextResponse.json({ error: 'Paid To is required.' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required.' }, { status: 400 });
    }

    const dateVal = expenseDate ? new Date(expenseDate) : new Date();
    const validFestival = await ensureFestivalRegistered(festival);

    const expense = await prisma.expense.create({
      data: {
        festival: validFestival,
        expenseCategory,
        description: description.trim(),
        amount: parsedAmount,
        paymentMethod,
        paidTo: paidTo.trim(),
        expenseDate: dateVal,
        enteredByUserId: user.id,
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
        enteredByUser: { select: { id: true, name: true, username: true } },
        attachments: true,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please login to add expenses.' }, { status: 401 });
    }
    console.error('Expense POST error:', error);
    return NextResponse.json({ error: 'Failed to record expense.' }, { status: 500 });
  }
}