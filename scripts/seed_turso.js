const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const url = 'libsql://pari-tower-fc-premn.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg0MjQyNDMsImlkIjoiMDFhMDY2NTgtYWMwMS03ZTdjLWI4NzctYmRhODZhOWQ0M2YzIiwia2lkIjoiSmthbElCdVV0cnZ1UGxOeWtURDM0S1ljZ1BQdFpMaC1pNDJkbm43LUVaZyIsInJpZCI6IjExY2QwZWFlLTY2ZWEtNDZlNy1iNTlhLTY1NmQzZmNjN2M3YyJ9.ZO7heHOsmPNYIcMR3bIYyWXvE6U8rZZP_Mp4-RWfFkevvRb7s-gzbiRp3mw8zgc-8Q77Rhg2hfQPczppd_vbAw';

async function seedTurso() {
  const client = createClient({ url, authToken });
  console.log('Seeding Turso database...');

  // 1. Create Users
  const adminHash = await bcrypt.hash('admin', 10);
  const rahulHash = await bcrypt.hash('rahul123', 10);
  const amitHash = await bcrypt.hash('amit123', 10);

  await client.execute({
    sql: `INSERT OR REPLACE INTO User (id, username, passwordHash, name, role, isActive, createdAt, updatedAt)
          VALUES ('user_admin', 'admin', ?, 'Pari Tower Admin', 'ADMIN', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [adminHash],
  });

  await client.execute({
    sql: `INSERT OR REPLACE INTO User (id, username, passwordHash, name, role, isActive, createdAt, updatedAt)
          VALUES ('user_rahul', 'rahul', ?, 'Rahul Sharma', 'ENTRY_USER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [rahulHash],
  });

  await client.execute({
    sql: `INSERT OR REPLACE INTO User (id, username, passwordHash, name, role, isActive, createdAt, updatedAt)
          VALUES ('user_amit', 'amit', ?, 'Amit Patel', 'ENTRY_USER', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [amitHash],
  });

  console.log('Seeded users in Turso: admin, rahul, amit.');

  // 2. Load and insert 262 flats and 4 refugee units
  const residentsJsonPath = path.join(__dirname, '..', 'prisma', 'residents.json');
  const residents = JSON.parse(fs.readFileSync(residentsJsonPath, 'utf-8'));

  console.log(`Inserting ${residents.length} flats and contributors into Turso...`);
  const batchStatements = [];

  for (let i = 0; i < residents.length; i++) {
    const r = residents[i];
    const flatId = `flat_${i + 1}`;
    const contribId = `contrib_flat_${i + 1}`;

    batchStatements.push({
      sql: `INSERT OR REPLACE INTO Flat (id, floor, flatNumber, displayName, altName, ownerName, ownerPhone, isRefugee, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [flatId, r.floor, r.flatNumber, r.displayName, r.altName || null, r.ownerName || null, r.ownerPhone || null, r.isRefugee ? 1 : 0],
    });

    if (!r.isRefugee) {
      batchStatements.push({
        sql: `INSERT OR REPLACE INTO Contributor (id, contributorType, flatId, name, category, phone, notes, createdAt, updatedAt)
              VALUES (?, 'flat', ?, ?, 'Resident', ?, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [contribId, flatId, `Flat ${r.altName || r.displayName}`, r.ownerPhone || null],
      });
    }
  }

  // Execute in batches of 50
  for (let i = 0; i < batchStatements.length; i += 50) {
    const chunk = batchStatements.slice(i, i + 50);
    await client.batch(chunk, 'write');
  }

  const flatCountRes = await client.execute('SELECT COUNT(*) as count FROM Flat WHERE isRefugee = 0');
  const refugeeCountRes = await client.execute('SELECT COUNT(*) as count FROM Flat WHERE isRefugee = 1');
  const userCountRes = await client.execute('SELECT COUNT(*) as count FROM User');

  console.log(`Successfully seeded Turso: ${flatCountRes.rows[0].count} regular flats, ${refugeeCountRes.rows[0].count} refugee units, ${userCountRes.rows[0].count} users.`);
}

seedTurso().catch(console.error);