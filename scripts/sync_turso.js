const { createClient } = require('@libsql/client');
const { execSync } = require('child_process');
const fs = require('fs');

const url = 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0MjQyNDMsImlkIjoiMDFhMDY2NTgtYWMwMS03ZTdjLWI4NzctYmRhODZhOWQ0M2YzIiwia2lkIjoiSmthbElCdVV0cnZ1UGxOeWtURDM0S1ljZ1BQdFpMaC1pNDJkbm43LUVaZyIsInJpZCI6IjExY2QwZWFlLTY2ZWEtNDZlNy1iNTlhLTY1NmQzZmNjN2M3YyJ9.ZO7heHOsmPNYIcMR3bIYyWXvE6U8rZZP_Mp4-RWfFkevvRb7s-gzbiRp3mw8zgc-8Q77Rhg2hfQPczppd_vbAw';

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