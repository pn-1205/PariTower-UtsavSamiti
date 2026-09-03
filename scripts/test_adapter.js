const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io',
  authToken: 'process.env.TURSO_AUTH_TOKEN'
});

const adapter = new PrismaLibSql(client);
console.log('Adapter created:', adapter);
console.log('Adapter methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)));