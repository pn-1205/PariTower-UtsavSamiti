export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { maskPhoneNumber } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const floorParam = searchParams.get('floor');
    const statusParam = searchParams.get('status'); // 'all', 'contributed', 'pending'
    const searchParam = searchParams.get('search');
    const showRefugee = searchParams.get('refugee') === 'true';

    const sessionUser = await getSessionUser();
    const isAuthenticated = !!sessionUser;

    const where: any = {
      isRefugee: showRefugee ? undefined : false,
    };

    if (floorParam && floorParam !== 'all') {
      where.floor = parseInt(floorParam, 10);
    }

    if (searchParam) {
      const q = searchParam.trim();
      where.OR = [
        { displayName: { contains: q } },
        { altName: { contains: q } },
        { ownerName: { contains: q } },
      ];
    }

    const flats = await prisma.flat.findMany({
      where,
      orderBy: [{ floor: 'asc' }, { flatNumber: 'asc' }],
      include: {
        contributors: {
          include: {
            deposits: {
              where: { deletedAt: null },
              select: { amount: true, receivedDate: true },
            },
            donations: {
              where: { deletedAt: null },
              select: { donationType: true, donationDate: true },
            },
          },
        },
      },
    });

    const results = flats.map((flat) => {
      let totalMoney = 0;
      let foodCount = 0;
      let otherCount = 0;
      let latestDate: Date | null = null;

      for (const contributor of flat.contributors) {
        for (const dep of contributor.deposits) {
          totalMoney += dep.amount;
          if (!latestDate || new Date(dep.receivedDate) > latestDate) {
            latestDate = new Date(dep.receivedDate);
          }
        }
        for (const don of contributor.donations) {
          if (don.donationType === 'Food') foodCount++;
          else otherCount++;
          if (!latestDate || new Date(don.donationDate) > latestDate) {
            latestDate = new Date(don.donationDate);
          }
        }
      }

      const isContributed = totalMoney > 0 || (foodCount + otherCount) > 0;

      return {
        id: flat.id,
        floor: flat.floor,
        flatNumber: flat.flatNumber,
        displayName: flat.displayName,
        altName: flat.altName,
        ownerName: flat.ownerName,
        ownerPhone: isAuthenticated ? flat.ownerPhone : maskPhoneNumber(flat.ownerPhone),
        isRefugee: flat.isRefugee,
        isContributed,
        totalMoney,
        foodDonations: foodCount,
        otherDonations: otherCount,
        lastContribution: latestDate ? latestDate.toISOString() : null,
      };
    });

    let filtered = results;
    if (statusParam === 'contributed') {
      filtered = results.filter((f) => f.isContributed);
    } else if (statusParam === 'pending') {
      filtered = results.filter((f) => !f.isContributed);
    }

    return NextResponse.json({
      flats: filtered,
      totalCount: filtered.length,
      regularCount: results.length,
    });
  } catch (error: any) {
    console.error('Flats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch flats.' }, { status: 500 });
  }
}