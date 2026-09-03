import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { maskPhoneNumber } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    const isAuthenticated = !!sessionUser;

    const flat = await prisma.flat.findUnique({
      where: { id: params.id },
      include: {
        contributors: {
          include: {
            deposits: {
              where: { deletedAt: null },
              orderBy: { receivedDate: 'desc' },
              include: {
                receivedByUser: { select: { id: true, name: true, username: true } },
                attachments: true,
              },
            },
            donations: {
              where: { deletedAt: null },
              orderBy: { donationDate: 'desc' },
              include: {
                receivedByUser: { select: { id: true, name: true, username: true } },
                attachments: true,
              },
            },
          },
        },
      },
    });

    if (!flat) {
      return NextResponse.json({ error: 'Flat not found.' }, { status: 404 });
    }

    const allDeposits: any[] = [];
    const allDonations: any[] = [];
    let totalMoney = 0;
    let foodDonations = 0;
    let otherDonations = 0;
    let lastContributionDate: string | null = null;

    for (const c of flat.contributors) {
      for (const d of c.deposits) {
        totalMoney += d.amount;
        allDeposits.push(d);
        if (!lastContributionDate || new Date(d.receivedDate) > new Date(lastContributionDate)) {
          lastContributionDate = d.receivedDate.toISOString();
        }
      }
      for (const don of c.donations) {
        if (don.donationType === 'Food') foodDonations++;
        else otherDonations++;
        allDonations.push(don);
        if (!lastContributionDate || new Date(don.donationDate) > new Date(lastContributionDate)) {
          lastContributionDate = don.donationDate.toISOString();
        }
      }
    }

    const contributor = flat.contributors[0] || null;

    return NextResponse.json({
      flat: {
        id: flat.id,
        floor: flat.floor,
        flatNumber: flat.flatNumber,
        displayName: flat.displayName,
        altName: flat.altName,
        ownerName: flat.ownerName,
        ownerPhone: isAuthenticated ? flat.ownerPhone : maskPhoneNumber(flat.ownerPhone),
        isRefugee: flat.isRefugee,
        isContributed: totalMoney > 0 || (foodDonations + otherDonations) > 0,
        totalMoney,
        foodDonations,
        otherDonations,
        lastContribution: lastContributionDate,
        contributorId: contributor?.id || null,
      },
      deposits: allDeposits,
      donations: allDonations,
    });
  } catch (error: any) {
    console.error('Flat detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch flat details.' }, { status: 500 });
  }
}