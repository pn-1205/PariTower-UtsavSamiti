const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const regular = await p.flat.count({ where: { isRefugee: false } });
  const refugee = await p.flat.count({ where: { isRefugee: true } });
  const depSum = await p.deposit.aggregate({ _sum: { amount: true }, where: { deletedAt: null } });
  const expSum = await p.expense.aggregate({ _sum: { amount: true }, where: { deletedAt: null } });
  const depCount = await p.deposit.count({ where: { deletedAt: null } });
  const expCount = await p.expense.count({ where: { deletedAt: null } });
  const donCount = await p.donation.count({ where: { deletedAt: null } });

  console.log('Seeded Database State:', {
    regularFlats: regular,
    refugeeFlats: refugee,
    totalDeposits: depSum._sum.amount,
    totalExpenses: expSum._sum.amount,
    balance: depSum._sum.amount - expSum._sum.amount,
    depositCount: depCount,
    expenseCount: expCount,
    donationCount: donCount
  });

  await p.$disconnect();
}

check();