const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');

const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0MjQyNDMsImlkIjoiMDFhMDY2NTgtYWMwMS03ZTdjLWI4NzctYmRhODZhOWQ0M2YzIiwia2lkIjoiSmthbElCdVV0cnZ1UGxOeWtURDM0S1ljZ1BQdFpMaC1pNDJkbm43LUVaZyIsInJpZCI6IjExY2QwZWFlLTY2ZWEtNDZlNy1iNTlhLTY1NmQzZmNjN2M3YyJ9.ZO7heHOsmPNYIcMR3bIYyWXvE6U8rZZP_Mp4-RWfFkevvRb7s-gzbiRp3mw8zgc-8Q77Rhg2hfQPczppd_vbAw';

async function updateLocalDB() {
  console.log('--- Updating Local SQLite Database ---');
  const prisma = new PrismaClient();

  // Deactivate existing dummy accounts
  await prisma.paymentAccount.updateMany({
    where: {
      upiId: { notIn: ['9921137881@icici', '9552051087@ptyes'] }
    },
    data: {
      isActive: false,
      isDefault: false
    }
  });

  // 1. Suryakant Dilip Sabale
  const existing1 = await prisma.paymentAccount.findFirst({
    where: { upiId: '9921137881@icici' }
  });
  if (existing1) {
    await prisma.paymentAccount.update({
      where: { id: existing1.id },
      data: {
        name: 'Suryakant Dilip Sabale',
        accountType: 'UPI_BANK',
        phone: '9921137881',
        bankName: 'ICICI Bank',
        isDefault: true,
        isActive: true
      }
    });
    console.log('Updated existing Suryakant Dilip Sabale in local DB.');
  } else {
    await prisma.paymentAccount.create({
      data: {
        id: 'acc_suryakant',
        name: 'Suryakant Dilip Sabale',
        accountType: 'UPI_BANK',
        upiId: '9921137881@icici',
        phone: '9921137881',
        bankName: 'ICICI Bank',
        isDefault: true,
        isActive: true
      }
    });
    console.log('Created Suryakant Dilip Sabale in local DB.');
  }

  // 2. Rajeshwar Dinkar Gawali
  const existing2 = await prisma.paymentAccount.findFirst({
    where: { upiId: '9552051087@ptyes' }
  });
  if (existing2) {
    await prisma.paymentAccount.update({
      where: { id: existing2.id },
      data: {
        name: 'Rajeshwar Dinkar Gawali',
        accountType: 'UPI_BANK',
        phone: '9552051087',
        bankName: 'Yes Bank',
        isDefault: false,
        isActive: true
      }
    });
    console.log('Updated existing Rajeshwar Dinkar Gawali in local DB.');
  } else {
    await prisma.paymentAccount.create({
      data: {
        id: 'acc_rajeshwar',
        name: 'Rajeshwar Dinkar Gawali',
        accountType: 'UPI_BANK',
        upiId: '9552051087@ptyes',
        phone: '9552051087',
        bankName: 'Yes Bank',
        isDefault: false,
        isActive: true
      }
    });
    console.log('Created Rajeshwar Dinkar Gawali in local DB.');
  }

  const allAccounts = await prisma.paymentAccount.findMany();
  console.log('Local Payment Accounts:');
  console.table(allAccounts.map(a => ({
    id: a.id,
    name: a.name,
    upiId: a.upiId,
    isDefault: a.isDefault,
    isActive: a.isActive
  })));

  await prisma.$disconnect();
}

async function updateTursoDB() {
  console.log('\n--- Updating Turso Cloud Database ---');
  const client = createClient({ url: tursoUrl, authToken: tursoToken });

  // Check if PaymentAccount table exists in Turso
  const checkTable = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PaymentAccount'");
  if (checkTable.rows.length === 0) {
    console.log('PaymentAccount table does not exist in Turso, running DDL...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "PaymentAccount" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "accountType" TEXT NOT NULL DEFAULT 'UPI_BANK',
        "upiId" TEXT,
        "phone" TEXT,
        "bankName" TEXT,
        "accountNumber" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  // Deactivate old dummy accounts
  await client.execute({
    sql: "UPDATE PaymentAccount SET isActive = 0, isDefault = 0 WHERE upiId NOT IN ('9921137881@icici', '9552051087@ptyes')",
    args: []
  });

  // Upsert Suryakant Dilip Sabale
  await client.execute({
    sql: `INSERT INTO PaymentAccount (id, name, accountType, upiId, phone, bankName, isDefault, isActive, createdAt, updatedAt)
          VALUES ('acc_suryakant', 'Suryakant Dilip Sabale', 'UPI_BANK', '9921137881@icici', '9921137881', 'ICICI Bank', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            accountType = excluded.accountType,
            upiId = excluded.upiId,
            phone = excluded.phone,
            bankName = excluded.bankName,
            isDefault = 1,
            isActive = 1,
            updatedAt = CURRENT_TIMESTAMP`,
    args: []
  });

  // Upsert Rajeshwar Dinkar Gawali
  await client.execute({
    sql: `INSERT INTO PaymentAccount (id, name, accountType, upiId, phone, bankName, isDefault, isActive, createdAt, updatedAt)
          VALUES ('acc_rajeshwar', 'Rajeshwar Dinkar Gawali', 'UPI_BANK', '9552051087@ptyes', '9552051087', 'Yes Bank', 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            accountType = excluded.accountType,
            upiId = excluded.upiId,
            phone = excluded.phone,
            bankName = excluded.bankName,
            isDefault = 0,
            isActive = 1,
            updatedAt = CURRENT_TIMESTAMP`,
    args: []
  });

  const res = await client.execute("SELECT id, name, upiId, isDefault, isActive FROM PaymentAccount");
  console.log('Turso Payment Accounts:');
  console.table(res.rows);
}

async function main() {
  await updateLocalDB();
  await updateTursoDB();
  console.log('\nAll payment accounts successfully synced!');
}

main().catch(console.error);
