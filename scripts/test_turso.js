const { createClient } = require('@libsql/client');

const url = 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io';
const authToken = 'process.env.TURSO_AUTH_TOKEN';

async function main() {
  const client = createClient({ url, authToken });
  const res = await client.execute('SELECT 1 as test');
  console.log('Turso connection successful!', res.rows);
}

main().catch(console.error);