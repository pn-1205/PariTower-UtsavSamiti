export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_FESTIVALS } from '@/lib/festivalUtils';

export async function GET() {
  try {
    // 1. Fetch all festivals from the Festival table
    const dbFestivals = await prisma.festival.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // 2. Fetch any distinct festivals already present in transactions
    const [depFests, expFests, donFests] = await Promise.all([
      prisma.deposit.findMany({
        where: { deletedAt: null },
        select: { festival: true },
        distinct: ['festival'],
      }),
      prisma.expense.findMany({
        where: { deletedAt: null },
        select: { festival: true },
        distinct: ['festival'],
      }),
      prisma.donation.findMany({
        where: { deletedAt: null },
        select: { festival: true },
        distinct: ['festival'],
      }),
    ]);

    const set = new Set<string>();

    // Add default festivals first
    DEFAULT_FESTIVALS.forEach((f) => set.add(f.trim()));

    // Add DB festivals
    dbFestivals.forEach((f) => {
      if (f.name && f.name.trim()) set.add(f.name.trim());
    });

    // Add transaction festivals
    depFests.forEach((d) => { if (d.festival?.trim()) set.add(d.festival.trim()); });
    expFests.forEach((e) => { if (e.festival?.trim()) set.add(e.festival.trim()); });
    donFests.forEach((dn) => { if (dn.festival?.trim()) set.add(dn.festival.trim()); });

    const festivals = Array.from(set);

    return NextResponse.json({ festivals, festivalDetails: dbFestivals });
  } catch (error: any) {
    console.error('Festivals GET error:', error);
    // Fallback to defaults
    return NextResponse.json({ festivals: DEFAULT_FESTIVALS, festivalDetails: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Festival name is required.' }, { status: 400 });
    }

    const cleanName = name.trim();

    // Check case-insensitive existence
    const existing = await prisma.festival.findFirst({
      where: {
        name: {
          equals: cleanName,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, festival: existing.name, created: false });
    }

    const created = await prisma.festival.create({
      data: {
        name: cleanName,
      },
    });

    return NextResponse.json({ success: true, festival: created.name, created: true });
  } catch (error: any) {
    console.error('Festivals POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save festival.' }, { status: 500 });
  }
}