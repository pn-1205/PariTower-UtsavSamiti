export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { maskPhoneNumber } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ flats: [], contributors: [], expenses: [], deposits: [] });
    }

    const sessionUser = await getSessionUser();
    const isAuthenticated = !!sessionUser;

    const [flats, contributors, expenses, deposits] = await Promise.all([
      prisma.flat.findMany({
        where: {
          isRefugee: false,
          OR: [
            { displayName: { contains: q } },
            { altName: { contains: q } },
          ],
        },
        take: 8,
      }),
      prisma.contributor.findMany({
        where: {
          contributorType: 'other',
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { category: { contains: q } },
          ],
        },
        take: 8,
      }),
      prisma.expense.findMany({
        where: {
          deletedAt: null,
          OR: [
            { paidTo: { contains: q } },
            { description: { contains: q } },
            { expenseCategory: { contains: q } },
          ],
        },
        include: { enteredByUser: { select: { name: true } } },
        take: 8,
      }),
      prisma.deposit.findMany({
        where: {
          deletedAt: null,
          OR: [
            { contributor: { name: { contains: q } } },
            { donorName: { contains: q } },
            { notes: { contains: q } },
            { paymentMethod: { contains: q } },
          ],
        },
        include: { contributor: true, receivedByUser: { select: { name: true } } },
        take: 8,
      }),
    ]);

    return NextResponse.json({
      flats: flats.map((f) => ({
        id: f.id,
        displayName: f.displayName,
        altName: f.altName,
      })),
      contributors: contributors.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        phone: isAuthenticated ? c.phone : maskPhoneNumber(c.phone),
      })),
      expenses: expenses.map((e) => ({
        id: e.id,
        paidTo: e.paidTo,
        category: e.expenseCategory,
        amount: e.amount,
        description: e.description,
        user: e.enteredByUser.name,
      })),
      deposits: deposits.map((d) => ({
        id: d.id,
        contributorName: d.donorName || d.contributor.name,
        amount: d.amount,
        paymentMethod: d.paymentMethod,
        user: d.receivedByUser.name,
      })),
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}