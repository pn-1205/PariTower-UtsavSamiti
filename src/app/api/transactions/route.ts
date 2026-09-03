export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFyDateRange } from '@/lib/festivalUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'all', 'income', 'expense', 'donation'
    const searchParam = searchParams.get('search');
    const festivalParam = searchParams.get('festival');
    const fyParam = searchParams.get('fy');

    // Build common filters
    const depositWhere: any = { deletedAt: null };
    const expenseWhere: any = { deletedAt: null };
    const donationWhere: any = { deletedAt: null };

    if (festivalParam && festivalParam !== 'all') {
      depositWhere.festival = festivalParam;
      expenseWhere.festival = festivalParam;
      donationWhere.festival = festivalParam;
    }

    if (fyParam && fyParam !== 'all') {
      const { start, end } = getFyDateRange(fyParam);
      if (start && end) {
        depositWhere.receivedDate = { gte: start, lte: end };
        expenseWhere.expenseDate = { gte: start, lte: end };
        donationWhere.donationDate = { gte: start, lte: end };
      }
    }

    const [deposits, expenses, donations] = await Promise.all([
      typeParam === 'expense' || typeParam === 'donation'
        ? []
        : prisma.deposit.findMany({
            where: depositWhere,
            orderBy: { receivedDate: 'desc' },
            include: {
              contributor: {
                include: {
                  flat: { select: { id: true, floor: true, flatNumber: true, displayName: true, altName: true } },
                },
              },
              receivedByUser: { select: { id: true, name: true } },
              attachments: true,
            },
          }),
      typeParam === 'income' || typeParam === 'donation'
        ? []
        : prisma.expense.findMany({
            where: expenseWhere,
            orderBy: { expenseDate: 'desc' },
            include: {
              enteredByUser: { select: { id: true, name: true } },
              attachments: true,
            },
          }),
      typeParam === 'income' || typeParam === 'expense'
        ? []
        : prisma.donation.findMany({
            where: donationWhere,
            orderBy: { donationDate: 'desc' },
            include: {
              contributor: {
                include: {
                  flat: { select: { id: true, floor: true, flatNumber: true, displayName: true, altName: true } },
                },
              },
              receivedByUser: { select: { id: true, name: true } },
              attachments: true,
            },
          }),
    ]);

    let list: any[] = [
      ...deposits.map((d) => {
        const flatNo = d.contributor.flat?.altName || d.contributor.flat?.displayName?.replace('-', '');
        let displayParty = d.contributor.name;
        if (d.donorName) {
          displayParty = flatNo ? `${d.donorName} (Flat ${flatNo})` : `${d.donorName} (${d.contributor.name})`;
        } else if (flatNo) {
          displayParty = `Flat ${flatNo}`;
        }

        return {
          id: d.id,
          kind: 'deposit',
          festival: d.festival || 'Ganesh Festival',
          date: d.receivedDate,
          title: d.donorName ? `Donor: ${d.donorName}` : d.contributor.name,
          party: displayParty,
          category: d.paymentMethod === 'Internal Transfer' ? 'Internal Transfer' : (d.contributor.contributorType === 'flat' ? 'Flat Contribution' : 'External Contributor'),
          amount: d.amount,
          paymentMethod: d.paymentMethod,
          user: d.receivedByUser.name,
          notes: d.notes,
          attachments: d.attachments,
        };
      }),
      ...expenses.map((e) => ({
        id: e.id,
        kind: 'expense',
        festival: e.festival || 'Ganesh Festival',
        date: e.expenseDate,
        title: e.description,
        party: e.paidTo,
        category: e.expenseCategory,
        amount: -e.amount,
        paymentMethod: e.paymentMethod,
        user: e.enteredByUser.name,
        notes: e.notes,
        attachments: e.attachments,
      })),
      ...donations.map((dn) => {
        const flatNo = dn.contributor.flat?.altName || dn.contributor.flat?.displayName?.replace('-', '');
        let displayParty = dn.contributor.name;
        if (dn.donorName) {
          displayParty = flatNo ? `${dn.donorName} (Flat ${flatNo})` : `${dn.donorName} (${dn.contributor.name})`;
        } else if (flatNo) {
          displayParty = `Flat ${flatNo}`;
        }

        return {
          id: dn.id,
          kind: 'donation',
          festival: dn.festival || 'Ganesh Festival',
          date: dn.donationDate,
          title: `${dn.quantity} ${dn.unit} ${dn.itemName}`,
          party: displayParty,
          category: `${dn.donationType} Donation`,
          amount: 0,
          estimatedValue: dn.estimatedValue,
          paymentMethod: dn.donationType,
          user: dn.receivedByUser.name,
          notes: dn.description || dn.notes,
          attachments: dn.attachments,
        };
      }),
    ];

    // Client-side text search if provided
    if (searchParam) {
      const q = searchParam.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.party?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.user?.toLowerCase().includes(q) ||
          t.festival?.toLowerCase().includes(q)
      );
    }

    // Sort chronologically descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate totals for filtered ledger
    const totalIncome = list
      .filter((t) => t.kind === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = list
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = totalIncome - totalExpense;

    return NextResponse.json({
      transactions: list,
      totals: {
        totalIncome,
        totalExpense,
        netBalance,
        count: list.length,
      },
    });
  } catch (error: any) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch ledger transactions.' }, { status: 500 });
  }
}