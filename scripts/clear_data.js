const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  console.log('Clearing all preseeded transactions...');

  // Delete all attachments
  await prisma.attachment.deleteMany({});
  console.log('Cleared all attachments.');

  // Delete all deposits
  await prisma.deposit.deleteMany({});
  console.log('Cleared all deposits.');

  // Delete all expenses
  await prisma.expense.deleteMany({});
  console.log('Cleared all expenses.');

  // Delete all donations
  await prisma.donation.deleteMany({});
  console.log('Cleared all in-kind donations.');

  // Delete external contributors created during seeding
  await prisma.contributor.deleteMany({
    where: { contributorType: 'other' },
  });
  console.log('Cleared mock external contributors.');

  const depCount = await prisma.deposit.count();
  const expCount = await prisma.expense.count();
  const donCount = await prisma.donation.count();
  const flatCount = await prisma.flat.count({ where: { isRefugee: false } });

  console.log('\n--- DATABASE STATUS AFTER CLEARING ---');
  console.log(`Deposits: ${depCount}`);
  console.log(`Expenses: ${expCount}`);
  console.log(`Donations: ${donCount}`);
  console.log(`Regular Flats Preserved: ${flatCount}`);
  console.log('--------------------------------------\n');
}

clearData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });