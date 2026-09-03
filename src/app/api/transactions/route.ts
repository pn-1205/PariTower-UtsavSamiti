export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // 'all', 'income', 'expense', 'donation'
    const searchParam = searchParams.get('search');

    const [deposits, expenses, donations] = await Promise.all([
      typeParam === 'expense' || typeParam === 'donation'
        ? []
        : prisma.deposit.findMany({
            where: { deletedAt: null },
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
            where: { deletedAt: null },
            orderBy: { expenseDate: 'desc' },
            include: {
              enteredByUser: { select: { id: true, name: true } },
              attachments: true,
            },
          }),
      typeParam === 'income' || typeParam === 'expense'
        ? []
        : prisma.donation.findMany({
            where: { deletedAt: null },
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
          date: d.receivedDate,
          title: d.donorName ? `Donor: ${d.donorName}` : d.contributor.name,
          party: displayParty,
          category: d.contributor.contributorType === 'flat' ? 'Flat Contribution' : 'External Contributor',
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

    if (searchParam) {
      const q = searchParam.trim().toLowerCase();
      list = list.filter((item) =>
        item.title?.toLowerCase().includes(q) ||
        item.party?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.user?.toLowerCase().includes(q) ||
        item.paymentMethod?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions: list });
  } catch (error: any) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch ledger.' }, { status: 500 });
  }
}