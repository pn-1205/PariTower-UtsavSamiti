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

    // Fetch festival details if a specific festival is requested
    let festivalRecord: any = null;
    let openingBalance = 0;

    if (festivalParam && festivalParam !== 'all') {
      festivalRecord = await prisma.festival.findFirst({
        where: { name: { equals: festivalParam.trim() } },
      });
      if (festivalRecord) {
        openingBalance = festivalRecord.openingBalance || 0;
      }
    }

    // Build common filters
    const depositWhere: any = { deletedAt: null, status: 'VERIFIED' };
    const expenseWhere: any = { deletedAt: null };
    const donationWhere: any = { deletedAt: null };

    if (festivalRecord) {
      const start = festivalRecord.startDate ? new Date(festivalRecord.startDate) : null;
      const end = festivalRecord.closedAt ? new Date(festivalRecord.closedAt) : null;

      // Expenses are event-specific
      expenseWhere.festival = festivalRecord.name;

      // Donations (in-kind) for this event
      donationWhere.festival = festivalRecord.name;

      // Incoming money is clubbed in common, belonging to the event's collection cycle
      if (start && end) {
        depositWhere.OR = [
          { festival: festivalRecord.name },
          { receivedDate: { gte: start, lte: end } },
        ];
      } else if (start) {
        depositWhere.OR = [
          { festival: festivalRecord.name },
          { receivedDate: { gte: start } },
        ];
      }
    } else if (festivalParam && festivalParam !== 'all') {
      expenseWhere.festival = festivalParam;
      donationWhere.festival = festivalParam;
    }

    if (fyParam && fyParam !== 'all') {
      const { start, end } = getFyDateRange(fyParam);
      if (start && end) {
        depositWhere.receivedDate = { ...(depositWhere.receivedDate || {}), gte: start, lte: end };
        expenseWhere.expenseDate = { gte: start, lte: end };
        donationWhere.donationDate = { gte: start, lte: end };

        // If festival is 'all', compute opening balance from prior financial years
        if (!festivalRecord) {
          const [priorDep, priorExp] = await Promise.all([
            prisma.deposit.aggregate({
              _sum: { amount: true },
              where: { deletedAt: null, status: 'VERIFIED', receivedDate: { lt: start } },
            }),
            prisma.expense.aggregate({
              _sum: { amount: true },
              where: { deletedAt: null, expenseDate: { lt: start } },
            }),
          ]);
          openingBalance = (priorDep._sum.amount || 0) - (priorExp._sum.amount || 0);
        }
      }
    }

    const [deposits, expenses, donations, paymentAccounts] = await Promise.all([
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
              paymentAccount: true,
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
              paymentAccount: true,
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
      prisma.paymentAccount.findMany({
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
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
          accountName: d.paymentAccount?.name || 'Cash in Hand (Treasury)',
          paymentAccountId: d.paymentAccountId,
          utrNumber: d.utrNumber,
          user: d.receivedByUser?.name || 'Verified Online',
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
        accountName: e.paymentAccount?.name || 'Cash in Hand (Treasury)',
        paymentAccountId: e.paymentAccountId,
        user: e.enteredByUser?.name || 'System',
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
          user: dn.receivedByUser?.name || 'System',
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
          t.accountName?.toLowerCase().includes(q) ||
          t.user?.toLowerCase().includes(q) ||
          t.festival?.toLowerCase().includes(q)
      );
    }

    // 1. Sort chronologically ascending to calculate accurate running balance from opening balance
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBal = openingBalance;
    list = list.map((t) => {
      if (t.kind === 'deposit') {
        runningBal += t.amount;
      } else if (t.kind === 'expense') {
        runningBal -= Math.abs(t.amount);
      }
      return {
        ...t,
        runningBalance: runningBal,
      };
    });

    // 2. Calculate totals for filtered ledger
    const totalIncome = list
      .filter((t) => t.kind === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = list
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = totalIncome - totalExpense;
    const closingBalance = openingBalance + netBalance;

    // 3. Apply requested sort order (default to 'desc' for latest activity, or 'asc' for passbook)
    const sortParam = searchParams.get('sort');
    if (sortParam !== 'asc') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // 4. Calculate per-account custodian balances
    const custodianBalances = paymentAccounts.map((acc) => {
      const accInflow = deposits
        .filter((d) => d.paymentAccountId === acc.id)
        .reduce((sum, d) => sum + d.amount, 0);
      const accOutflow = expenses
        .filter((e) => e.paymentAccountId === acc.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        id: acc.id,
        name: acc.name,
        accountType: acc.accountType,
        upiId: acc.upiId,
        inflow: accInflow,
        outflow: accOutflow,
        balance: accInflow - accOutflow,
      };
    });

    const festivalInfo = festivalRecord
      ? {
          id: festivalRecord.id,
          name: festivalRecord.name,
          status: festivalRecord.status,
          isFrozen: festivalRecord.status === 'CLOSED',
          startDate: festivalRecord.startDate,
          endDate: festivalRecord.endDate,
          closedAt: festivalRecord.closedAt,
          openingBalance: festivalRecord.openingBalance || 0,
          closingBalance: festivalRecord.closingBalance ?? closingBalance,
          notes: festivalRecord.notes,
        }
      : null;

    return NextResponse.json({
      transactions: list,
      totals: {
        openingBalance,
        totalIncome,
        totalExpense,
        netBalance,
        closingBalance,
        count: list.length,
      },
      festivalInfo,
      custodianBalances,
    });
  } catch (error: any) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch ledger transactions.' }, { status: 500 });
  }
}