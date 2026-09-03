const { createClient } = require('@libsql/client');
const { execSync } = require('child_process');
const fs = require('fs');

const url = 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io';
const authToken = 'process.env.TURSO_AUTH_TOKEN';

async function main() {
  console.log('Generating DDL SQL from prisma schema...');
  const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { encoding: 'utf-8' });
  
  console.log('Connecting to Turso...');
  const client = createClient({ url, authToken });

  console.log('Applying schema to Turso cloud database...');
  await client.executeMultiple(sql);
  console.log('Schema successfully applied to Turso!');

  // Check tables
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Turso Tables:', tables.rows.map(r => r.name));
}

main().catch(console.error);