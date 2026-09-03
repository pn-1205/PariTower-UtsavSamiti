const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

const url = 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io';
const authToken = 'process.env.TURSO_AUTH_TOKEN';

async function test() {
  const client = createClient({ url, authToken });
  const adapter = new PrismaLibSQL(client);
  const prisma = new PrismaClient({ adapter });

  const flats = await prisma.flat.count({ where: { isRefugee: false } });
  const users = await prisma.user.findMany({ select: { username: true, role: true } });
  console.log(`Prisma Client + Turso LibSQL Adapter connected! Flats count: ${flats}, Users:`, users);

  await prisma.$disconnect();
}

test().catch(console.error);