const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Pari Tower Festival Committee database...');

  // Clean existing records in reverse dependency order
  await prisma.attachment.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.contributor.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const adminPasswordHash = bcrypt.hashSync('admin', 10);
  const rahulPasswordHash = bcrypt.hashSync('rahul123', 10);
  const amitPasswordHash = bcrypt.hashSync('amit123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Pari Tower Admin',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const rahulUser = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      username: 'rahul',
      passwordHash: rahulPasswordHash,
      role: 'ENTRY_USER',
      isActive: true,
    },
  });

  const amitUser = await prisma.user.create({
    data: {
      name: 'Amit Patel',
      username: 'amit',
      passwordHash: amitPasswordHash,
      role: 'ENTRY_USER',
      isActive: true,
    },
  });

  console.log('Created users: admin, rahul, amit');

  // 2. Load and create Flats & Flat Contributors
  const residentsFile = path.join(__dirname, 'residents.json');
  const residents = JSON.parse(fs.readFileSync(residentsFile, 'utf-8'));

  const flatMap = new Map();
  const contributorMap = new Map();

  for (const r of residents) {
    const flat = await prisma.flat.create({
      data: {
        floor: r.floor,
        flatNumber: r.flatNumber,
        displayName: r.displayName,
        altName: r.altName,
        ownerName: r.ownerName,
        ownerPhone: r.ownerPhone,
        isRefugee: r.isRefugee,
        isActive: true,
      },
    });

    flatMap.set(r.displayName, flat);

    // Create a Contributor record for the flat
    const contributor = await prisma.contributor.create({
      data: {
        contributorType: 'flat',
        flatId: flat.id,
        name: 'Flat ' + flat.displayName,
        category: r.isRefugee ? 'Refugee Area' : 'Resident',
        phone: r.ownerPhone,
        notes: r.ownerName ? ('Owner: ' + r.ownerName.split('\n')[0]) : null,
      },
    });

    contributorMap.set(r.displayName, contributor);
  }

  const regularFlatsCount = await prisma.flat.count({ where: { isRefugee: false } });
  const refugeeFlatsCount = await prisma.flat.count({ where: { isRefugee: true } });
  console.log('Generated ' + regularFlatsCount + ' regular flats and ' + refugeeFlatsCount + ' refugee-area flats.');

  // 3. External Contributors
  const rajesh = await prisma.contributor.create({
    data: {
      contributorType: 'other',
      name: 'Rajesh Kumar',
      category: 'Guest',
      phone: '9822012345',
      notes: 'Well-wisher from Sector 4',
    },
  });

  const supermarket = await prisma.contributor.create({
    data: {
      contributorType: 'other',
      name: 'ABC Supermarket',
      category: 'Business/Shop',
      phone: '9855511223',
      notes: 'Local market festival sponsor',
    },
  });

  const vikram = await prisma.contributor.create({
    data: {
      contributorType: 'other',
      name: 'Vikram Malhotra',
      category: 'Sponsor',
      phone: '9876543210',
      notes: 'Main gate decoration sponsor',
    },
  });

  console.log('Created external contributors');

  // 4. Sample Deposits
  // Flat 1-01 deposit 1
  const dep1 = await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('1-01').id,
      amount: 2000,
      paymentMethod: 'Cash',
      receivedDate: new Date('2026-09-01T10:30:00Z'),
      receivedByUserId: rahulUser.id,
      notes: 'Festival maintenance & pooja contribution',
    },
  });

  // Flat 1-01 deposit 2 (multiple deposits from same flat)
  const dep2 = await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('1-01').id,
      amount: 500,
      paymentMethod: 'UPI',
      receivedDate: new Date('2026-09-02T11:00:00Z'),
      receivedByUserId: rahulUser.id,
      notes: 'Additional donation for evening Prasad',
    },
  });

  // Flat 2-04
  const dep3 = await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('2-04').id,
      amount: 2500,
      paymentMethod: 'UPI',
      receivedDate: new Date('2026-09-01T15:20:00Z'),
      receivedByUserId: amitUser.id,
      notes: 'UPI Ref: 429188291029',
    },
  });

  // Flat 3-10
  const dep4 = await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('3-10').id,
      amount: 2000,
      paymentMethod: 'Bank Transfer',
      receivedDate: new Date('2026-09-02T09:45:00Z'),
      receivedByUserId: rahulUser.id,
      notes: 'NEFT transfer receipt verified',
    },
  });

  // Flat 5-12
  const dep5 = await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('5-12').id,
      amount: 2000,
      paymentMethod: 'UPI',
      receivedDate: new Date('2026-09-02T16:15:00Z'),
      receivedByUserId: rahulUser.id,
      notes: 'Google Pay transfer',
    },
  });

  // Flat 7-15
  await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('7-15').id,
      amount: 3000,
      paymentMethod: 'UPI',
      receivedDate: new Date('2026-09-02T17:00:00Z'),
      receivedByUserId: amitUser.id,
      notes: 'Special Aarti sponsorship contribution',
    },
  });

  // Flat 10-08
  await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('10-08').id,
      amount: 2000,
      paymentMethod: 'Cash',
      receivedDate: new Date('2026-09-03T08:30:00Z'),
      receivedByUserId: amitUser.id,
      notes: 'Cash received at building reception desk',
    },
  });

  // Flat 14-19
  await prisma.deposit.create({
    data: {
      contributorId: contributorMap.get('14-19').id,
      amount: 5000,
      paymentMethod: 'UPI',
      receivedDate: new Date('2026-09-03T09:10:00Z'),
      receivedByUserId: rahulUser.id,
      notes: 'Penthouse family festival contribution',
    },
  });

  // External contributor Rajesh Kumar
  const depRajesh = await prisma.deposit.create({
    data: {
      contributorId: rajesh.id,
      amount: 5000,
      paymentMethod: 'UPI',
      receivedDate: new Date('2026-09-03T10:00:00Z'),
      receivedByUserId: amitUser.id,
      notes: 'Guest contribution via PhonePe',
    },
  });

  // External contributor ABC Supermarket
  await prisma.deposit.create({
    data: {
      contributorId: supermarket.id,
      amount: 10000,
      paymentMethod: 'Bank Transfer',
      receivedDate: new Date('2026-09-03T10:45:00Z'),
      receivedByUserId: rahulUser.id,
      notes: 'Commercial sponsor donation',
    },
  });

  // Add attachment to dep5 and depRajesh
  await prisma.attachment.create({
    data: {
      fileName: 'upi-flat-5-12.png',
      filePath: '/uploads/sample-upi.png',
      fileType: 'image/png',
      fileSize: 1024,
      uploadedByUserId: rahulUser.id,
      depositId: dep5.id,
    },
  });

  await prisma.attachment.create({
    data: {
      fileName: 'rajesh-upi-screenshot.png',
      filePath: '/uploads/sample-upi.png',
      fileType: 'image/png',
      fileSize: 1024,
      uploadedByUserId: amitUser.id,
      depositId: depRajesh.id,
    },
  });

  // 5. In-Kind Donations (Food & Other)
  // Flat 2-05: 10 kg Rice
  await prisma.donation.create({
    data: {
      contributorId: contributorMap.get('2-05').id,
      donationType: 'Food',
      itemName: 'Basmati Rice',
      quantity: 10,
      unit: 'kg',
      estimatedValue: 600,
      donationDate: new Date('2026-09-02T12:00:00Z'),
      receivedByUserId: rahulUser.id,
      description: '10 kg premium rice for Maha Prasad preparation',
    },
  });

  // Flat 5-12: Flower Garlands
  await prisma.donation.create({
    data: {
      contributorId: contributorMap.get('5-12').id,
      donationType: 'Other',
      itemName: 'Flower Garlands (Mala)',
      quantity: 20,
      unit: 'garlands',
      estimatedValue: 500,
      donationDate: new Date('2026-09-02T14:30:00Z'),
      receivedByUserId: amitUser.id,
      description: 'Fresh marigold garlands for idol stage',
    },
  });

  // Rajesh Kumar: Sweet Laddoos
  await prisma.donation.create({
    data: {
      contributorId: rajesh.id,
      donationType: 'Food',
      itemName: 'Motichoor Laddoos',
      quantity: 25,
      unit: 'boxes',
      estimatedValue: 1250,
      donationDate: new Date('2026-09-03T11:00:00Z'),
      receivedByUserId: rahulUser.id,
      description: '25 boxes of fresh sweets for distribution',
    },
  });

  // Flat 6-01: Wheat Flour
  await prisma.donation.create({
    data: {
      contributorId: contributorMap.get('6-01').id,
      donationType: 'Food',
      itemName: 'Wheat Flour (Atta)',
      quantity: 30,
      unit: 'kg',
      estimatedValue: 1200,
      donationDate: new Date('2026-09-03T11:30:00Z'),
      receivedByUserId: amitUser.id,
      description: 'For Puri preparation on festival day 1',
    },
  });

  // 6. Expenses
  const exp1 = await prisma.expense.create({
    data: {
      expenseCategory: 'Decorations',
      description: 'Flower decoration for main stage & welcome arch',
      amount: 8500,
      paymentMethod: 'UPI',
      paidTo: 'ABC Decorations',
      expenseDate: new Date('2026-09-01T18:00:00Z'),
      enteredByUserId: rahulUser.id,
      notes: 'Advance + final stage decoration settlement',
    },
  });

  const exp2 = await prisma.expense.create({
    data: {
      expenseCategory: 'Food',
      description: 'Catering groceries and Mahaprasad provisions',
      amount: 12000,
      paymentMethod: 'Bank Transfer',
      paidTo: 'Sharma Caterers',
      expenseDate: new Date('2026-09-02T10:00:00Z'),
      enteredByUserId: amitUser.id,
      notes: 'Invoice #SC-2026-88',
    },
  });

  await prisma.expense.create({
    data: {
      expenseCategory: 'Sound System',
      description: 'Sound setup, cordless microphones & amplifiers rental (3 days)',
      amount: 5000,
      paymentMethod: 'Cash',
      paidTo: 'Sound System Vendor',
      expenseDate: new Date('2026-09-02T13:00:00Z'),
      enteredByUserId: rahulUser.id,
      notes: 'Cash paid on installation',
    },
  });

  await prisma.expense.create({
    data: {
      expenseCategory: 'Printing',
      description: 'Festival schedule banners, receipt books & posters',
      amount: 2500,
      paymentMethod: 'UPI',
      paidTo: 'Metro Prints',
      expenseDate: new Date('2026-09-02T15:00:00Z'),
      enteredByUserId: amitUser.id,
      notes: 'Banners installed in tower lobby and lifts',
    },
  });

  await prisma.expense.create({
    data: {
      expenseCategory: 'Transportation',
      description: 'Tempo fare for fetching chairs, tables & festival items',
      amount: 1500,
      paymentMethod: 'Cash',
      paidTo: 'Local Tempo Service',
      expenseDate: new Date('2026-09-03T09:00:00Z'),
      enteredByUserId: rahulUser.id,
      notes: '2 round trips',
    },
  });

  await prisma.expense.create({
    data: {
      expenseCategory: 'Miscellaneous',
      description: 'Electrical extension cords, tape and safety lighting',
      amount: 1000,
      paymentMethod: 'Cash',
      paidTo: 'General Hardware Store',
      expenseDate: new Date('2026-09-03T10:00:00Z'),
      enteredByUserId: amitUser.id,
      notes: 'Hardware bill attached',
    },
  });

  // Attach receipt to exp1
  await prisma.attachment.create({
    data: {
      fileName: 'abc-decorations-receipt.png',
      filePath: '/uploads/sample-receipt.png',
      fileType: 'image/png',
      fileSize: 1024,
      uploadedByUserId: rahulUser.id,
      expenseId: exp1.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });