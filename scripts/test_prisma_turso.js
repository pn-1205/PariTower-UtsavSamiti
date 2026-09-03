const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

const url = 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0MjQyNDMsImlkIjoiMDFhMDY2NTgtYWMwMS03ZTdjLWI4NzctYmRhODZhOWQ0M2YzIiwia2lkIjoiSmthbElCdVV0cnZ1UGxOeWtURDM0S1ljZ1BQdFpMaC1pNDJkbm43LUVaZyIsInJpZCI6IjExY2QwZWFlLTY2ZWEtNDZlNy1iNTlhLTY1NmQzZmNjN2M3YyJ9.ZO7heHOsmPNYIcMR3bIYyWXvE6U8rZZP_Mp4-RWfFkevvRb7s-gzbiRp3mw8zgc-8Q77Rhg2hfQPczppd_vbAw';

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