const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clean Pari Tower Utsav Samiti database...');

  // 1. Create or upsert Admin User
  const adminPasswordHash = bcrypt.hashSync('admin', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      name: 'Pari Tower Admin',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      id: 'user_admin',
      name: 'Pari Tower Admin',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Ensured admin user exists.');

  // 2. Load and seed Flats from residents.json
  const residentsFile = path.join(__dirname, 'residents.json');
  if (fs.existsSync(residentsFile)) {
    const residents = JSON.parse(fs.readFileSync(residentsFile, 'utf-8'));

    for (const r of residents) {
      const existingFlat = await prisma.flat.findFirst({
        where: { displayName: r.displayName },
      });

      let flat = existingFlat;
      if (!flat) {
        flat = await prisma.flat.create({
          data: {
            floor: r.floor,
            flatNumber: r.flatNumber,
            displayName: r.displayName,
            altName: r.altName,
            isRefugee: r.isRefugee,
            isActive: true,
          },
        });
      }

      // Ensure Contributor record exists for the flat
      const existingContributor = await prisma.contributor.findFirst({
        where: { flatId: flat.id },
      });

      if (!existingContributor) {
        await prisma.contributor.create({
          data: {
            contributorType: 'flat',
            flatId: flat.id,
            name: 'Flat ' + (flat.altName || flat.displayName),
            category: r.isRefugee ? 'Refugee Area' : 'Resident',
            phone: null,
            notes: null,
          },
        });
      }
    }

    const flatCount = await prisma.flat.count();
    console.log(`Verified ${flatCount} flats in database.`);
  }

  // 3. Upsert Official Payment Accounts
  await prisma.paymentAccount.upsert({
    where: { id: 'acc_suryakant' },
    update: {
      name: 'Suryakant Dilip Sabale',
      accountType: 'UPI_BANK',
      upiId: '9921137881@icici',
      phone: '9921137881',
      bankName: 'ICICI Bank',
      isDefault: true,
      isActive: true,
    },
    create: {
      id: 'acc_suryakant',
      name: 'Suryakant Dilip Sabale',
      accountType: 'UPI_BANK',
      upiId: '9921137881@icici',
      phone: '9921137881',
      bankName: 'ICICI Bank',
      isDefault: true,
      isActive: true,
    },
  });

  await prisma.paymentAccount.upsert({
    where: { id: 'acc_rajeshwar' },
    update: {
      name: 'Rajeshwar Dinkar Gawali',
      accountType: 'UPI_BANK',
      upiId: '9552051087@ptyes',
      phone: '9552051087',
      bankName: 'Yes Bank',
      isDefault: false,
      isActive: true,
    },
    create: {
      id: 'acc_rajeshwar',
      name: 'Rajeshwar Dinkar Gawali',
      accountType: 'UPI_BANK',
      upiId: '9552051087@ptyes',
      phone: '9552051087',
      bankName: 'Yes Bank',
      isDefault: false,
      isActive: true,
    },
  });

  console.log('Seeded official UPI accounts: Suryakant Dilip Sabale and Rajeshwar Dinkar Gawali.');
  console.log('Clean seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });