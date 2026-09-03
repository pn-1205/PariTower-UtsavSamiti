export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, requireAuth } from '@/lib/auth';
import { maskPhoneNumber } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'flat', 'other', 'all'
    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');

    const sessionUser = await getSessionUser();
    const isAuthenticated = !!sessionUser;

    const where: any = {};

    if (typeParam && typeParam !== 'all') {
      where.contributorType = typeParam;
    }

    if (categoryParam && categoryParam !== 'all') {
      where.category = categoryParam;
    }

    if (searchParam) {
      const q = searchParam.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    const contributors = await prisma.contributor.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        flat: { select: { id: true, floor: true, flatNumber: true, displayName: true, isRefugee: true } },
        deposits: {
          where: { deletedAt: null },
          select: { amount: true, receivedDate: true },
        },
        donations: {
          where: { deletedAt: null },
          select: { donationType: true, donationDate: true },
        },
      },
    });

    const results = contributors.map((c) => {
      let totalMoney = 0;
      let foodCount = 0;
      let otherCount = 0;
      let latestDate: Date | null = null;

      for (const d of c.deposits) {
        totalMoney += d.amount;
        if (!latestDate || new Date(d.receivedDate) > latestDate) {
          latestDate = new Date(d.receivedDate);
        }
      }

      for (const don of c.donations) {
        if (don.donationType === 'Food') foodCount++;
        else otherCount++;
        if (!latestDate || new Date(don.donationDate) > latestDate) {
          latestDate = new Date(don.donationDate);
        }
      }

      return {
        id: c.id,
        contributorType: c.contributorType,
        flatId: c.flatId,
        flat: c.flat,
        name: c.name,
        category: c.category,
        phone: isAuthenticated ? c.phone : maskPhoneNumber(c.phone),
        notes: isAuthenticated ? c.notes : null, // Admin only notes
        totalMoney,
        foodDonations: foodCount,
        otherDonations: otherCount,
        lastContribution: latestDate ? latestDate.toISOString() : null,
      };
    });

    return NextResponse.json({ contributors: results });
  } catch (error: any) {
    console.error('Contributors GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch contributors.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const { name, category, phone, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Contributor Name is required.' }, { status: 400 });
    }

    // Check if contributor already exists by case-insensitive name
    const existing = await prisma.contributor.findFirst({
      where: {
        contributorType: 'other',
        name: { equals: name.trim() },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        contributor: existing,
        isExisting: true,
      });
    }

    const contributor = await prisma.contributor.create({
      data: {
        contributorType: 'other',
        name: name.trim(),
        category: category || 'Guest',
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      contributor,
      isExisting: false,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please login to add contributors.' }, { status: 401 });
    }
    console.error('Contributor POST error:', error);
    return NextResponse.json({ error: 'Failed to create contributor.' }, { status: 500 });
  }
}