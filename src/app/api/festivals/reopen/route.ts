export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    let user;
    try {
      user = await requireAdmin();
    } catch {
      return NextResponse.json({ error: 'Only administrators can reopen frozen festival ledgers.' }, { status: 403 });
    }

    const body = await request.json();
    const { festivalName } = body;

    if (!festivalName || typeof festivalName !== 'string' || !festivalName.trim()) {
      return NextResponse.json({ error: 'Festival name to reopen is required.' }, { status: 400 });
    }

    const cleanFestName = festivalName.trim();

    const festival = await prisma.festival.findFirst({
      where: { name: { equals: cleanFestName } },
    });

    if (!festival) {
      return NextResponse.json({ error: `Festival '${cleanFestName}' not found.` }, { status: 404 });
    }

    if (festival.status !== 'CLOSED') {
      return NextResponse.json({ error: `Festival '${cleanFestName}' is not currently closed.` }, { status: 400 });
    }

    const reopened = await prisma.festival.update({
      where: { id: festival.id },
      data: {
        status: 'ACTIVE',
        closedAt: null,
        closingBalance: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Festival '${cleanFestName}' reopened successfully.`,
      festival: reopened,
    });
  } catch (error: any) {
    console.error('Error reopening festival ledger:', error);
    return NextResponse.json({ error: error.message || 'Failed to reopen festival ledger.' }, { status: 500 });
  }
}
