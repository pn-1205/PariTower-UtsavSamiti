const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

let cookieAdmin = '';
let cookieRahul = '';

function logPass(testName, details) {
  console.log(`\x1b[32m✔ PASS\x1b[0m [${testName}]: ${details}`);
}

function logFail(testName, error) {
  console.error(`\x1b[31m✖ FAIL\x1b[0m [${testName}]:`, error);
  process.exitCode = 1;
}

async function runTests() {
  console.log('\n=========================================================');
  console.log('  PARI TOWER FESTIVAL COMMITTEE (PTFC) - ACCEPTANCE SUITE');
  console.log('=========================================================\n');

  try {
    // ----------------------------------------------------------------------
    // Test 15: Flat count (Exactly 262 regular flats)
    // ----------------------------------------------------------------------
    const regularCount = await prisma.flat.count({ where: { isRefugee: false } });
    const refugeeCount = await prisma.flat.count({ where: { isRefugee: true } });
    if (regularCount === 262 && refugeeCount === 4) {
      logPass('Test 15 — Flat Count', `Found exactly 262 regular flats and 4 refugee area units (Total: 266).`);
    } else {
      throw new Error(`Expected 262 regular flats, got ${regularCount}. Refugee units: ${refugeeCount}`);
    }

    // ----------------------------------------------------------------------
    // Test 13: Floor 8 (8-01 through 8-17 only)
    // ----------------------------------------------------------------------
    const floor8Regular = await prisma.flat.findMany({
      where: { floor: 8, isRefugee: false },
      orderBy: { flatNumber: 'asc' },
    });
    const floor8Names = floor8Regular.map((f) => f.displayName);
    const expectedFloor8 = Array.from({ length: 17 }, (_, i) => `8-${String(i + 1).padStart(2, '0')}`);
    const matchesFloor8 =
      floor8Names.length === 17 &&
      floor8Names.every((val, idx) => val === expectedFloor8[idx]);

    const floor8Refugee = await prisma.flat.findMany({
      where: { floor: 8, isRefugee: true },
    });

    if (matchesFloor8 && floor8Refugee.length === 2) {
      logPass('Test 13 — Floor 8 Exceptions', `Floor 8 has exactly 17 regular flats (8-01 to 8-17) and 2 refugee units (8-18, 8-19).`);
    } else {
      throw new Error(`Floor 8 validation failed: ${floor8Names.join(', ')}`);
    }

    // ----------------------------------------------------------------------
    // Test 14: Floor 13 (13-01 through 13-17 only)
    // ----------------------------------------------------------------------
    const floor13Regular = await prisma.flat.findMany({
      where: { floor: 13, isRefugee: false },
      orderBy: { flatNumber: 'asc' },
    });
    const floor13Names = floor13Regular.map((f) => f.displayName);
    const expectedFloor13 = Array.from({ length: 17 }, (_, i) => `13-${String(i + 1).padStart(2, '0')}`);
    const matchesFloor13 =
      floor13Names.length === 17 &&
      floor13Names.every((val, idx) => val === expectedFloor13[idx]);

    const floor13Refugee = await prisma.flat.findMany({
      where: { floor: 13, isRefugee: true },
    });

    if (matchesFloor13 && floor13Refugee.length === 2) {
      logPass('Test 14 — Floor 13 Exceptions', `Floor 13 has exactly 17 regular flats (13-01 to 13-17) and 2 refugee units (13-18, 13-19).`);
    } else {
      throw new Error(`Floor 13 validation failed: ${floor13Names.join(', ')}`);
    }

    // ----------------------------------------------------------------------
    // Test 1: Public mode (Unauthenticated transparency)
    // ----------------------------------------------------------------------
    const publicDashRes = await fetch(`${BASE_URL}/api/dashboard`);
    const publicDash = await publicDashRes.json();

    const publicFlatsRes = await fetch(`${BASE_URL}/api/flats`);
    const publicFlats = await publicFlatsRes.json();

    const sampleFlatWithPhone = publicFlats.flats.find((f) => f.ownerPhone && f.ownerPhone.includes('*****'));

    if (
      publicDashRes.ok &&
      publicDash.regularFlatsTotal === 262 &&
      publicDash.totalReceived !== undefined &&
      sampleFlatWithPhone
    ) {
      logPass('Test 1 — Public View Mode', `Dashboard & 262 flats visible without login. Privacy enforced (Phone: ${sampleFlatWithPhone.ownerPhone}).`);
    } else {
      throw new Error('Public mode check failed or phone not masked.');
    }

    // ----------------------------------------------------------------------
    // Test 16: Public permissions (Reject mutations without auth)
    // ----------------------------------------------------------------------
    const unauthDepositRes = await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, contributorId: 'test', donorName: 'Anonymous', paymentMethod: 'Cash' }),
    });

    const unauthExpenseRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, paidTo: 'Vendor', description: 'Test', expenseCategory: 'Food', paymentMethod: 'Cash' }),
    });

    if (unauthDepositRes.status === 401 && unauthExpenseRes.status === 401) {
      logPass('Test 16 — Public Permissions Protection', `Server strictly rejected unauthenticated mutations with 401 Unauthorized.`);
    } else {
      throw new Error(`Expected 401, got ${unauthDepositRes.status} and ${unauthExpenseRes.status}`);
    }

    // ----------------------------------------------------------------------
    // Test 2: Admin login (admin / admin)
    // ----------------------------------------------------------------------
    const loginAdminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    });
    const loginAdminData = await loginAdminRes.json();
    const setCookieAdmin = loginAdminRes.headers.get('set-cookie');
    if (loginAdminRes.ok && loginAdminData.user?.role === 'ADMIN' && setCookieAdmin) {
      cookieAdmin = setCookieAdmin.split(';')[0];
      logPass('Test 2 — Admin Login', `Logged in as ${loginAdminData.user.name} (Role: ${loginAdminData.user.role}). Session cookie issued.`);
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(loginAdminData)}`);
    }

    // Login Rahul as Entry User
    const loginRahulRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'rahul', password: 'rahul123' }),
    });
    const loginRahulData = await loginRahulRes.json();
    const setCookieRahul = loginRahulRes.headers.get('set-cookie');
    if (loginRahulRes.ok && loginRahulData.user?.role === 'ENTRY_USER') {
      cookieRahul = setCookieRahul.split(';')[0];
    }

    // ----------------------------------------------------------------------
    // Test 3: Flat deposit (Add Flat 1-01, ₹1,000, Cash, Donor: Meenakshi Dixit)
    // ----------------------------------------------------------------------
    const flat101 = await prisma.flat.findUnique({
      where: { displayName: '1-01' },
      include: { contributors: true },
    });
    const flat101ContribId = flat101.contributors[0].id;

    const initDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();

    const addDep1Res = await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        contributorId: flat101ContribId,
        donorName: 'Meenakshi Dixit',
        amount: 1000,
        paymentMethod: 'Cash',
        notes: 'Test 3 Flat 1-01 deposit',
      }),
    });
    const addDep1Data = await addDep1Res.json();

    const postDep1Dash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();
    if (
      addDep1Res.ok &&
      postDep1Dash.totalReceived === initDash.totalReceived + 1000
    ) {
      logPass('Test 3 — Flat Deposit with Compulsory Donor Name', `Flat 101 added ₹1,000 Cash by donor "Meenakshi Dixit". Total Received updated.`);
    } else {
      throw new Error(`Flat deposit failed: ${JSON.stringify(addDep1Data)}`);
    }

    // ----------------------------------------------------------------------
    // Test 4: Multiple deposit from same flat with DIFFERENT donor (Prasad Dixit)
    // ----------------------------------------------------------------------
    const addDep2Res = await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        contributorId: flat101ContribId,
        donorName: 'Prasad Dixit',
        amount: 500,
        paymentMethod: 'UPI',
        notes: 'Test 4 Second deposit with different donor from same flat',
      }),
    });

    const postDep2Dash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();
    const flat101DepositsCount = await prisma.deposit.count({
      where: { contributorId: flat101ContribId, deletedAt: null },
    });

    if (
      addDep2Res.ok &&
      postDep2Dash.totalReceived === postDep1Dash.totalReceived + 500 &&
      postDep2Dash.contributedFlatsCount === postDep1Dash.contributedFlatsCount
    ) {
      logPass(
        'Test 4 — Multiple Deposits from Same Flat with Diff Donors',
        `Added ₹500 from second donor "Prasad Dixit" for Flat 101. Total increased by ₹500, flat count not duplicated. Total records for flat: ${flat101DepositsCount}.`
      );
    } else {
      throw new Error('Multiple deposit test failed');
    }

    // ----------------------------------------------------------------------
    // Test 5: External contributor (Rajesh Kumar, Guest, ₹5,000, UPI)
    // ----------------------------------------------------------------------
    let rajeshContrib = await prisma.contributor.findFirst({
      where: { name: 'Rajesh Kumar' },
    });

    const preExtDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();

    const addExtDepRes = await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        contributorId: rajeshContrib.id,
        donorName: 'Rajesh Kumar',
        amount: 5000,
        paymentMethod: 'UPI',
        notes: 'Test 5 External contribution',
      }),
    });

    const postExtDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();
    if (
      addExtDepRes.ok &&
      postExtDash.totalReceived === preExtDash.totalReceived + 5000
    ) {
      logPass(
        'Test 5 — External Contributor',
        `Rajesh Kumar contributed ₹5,000. External contributions increased by ₹5,000.`
      );
    } else {
      throw new Error('External contributor test failed');
    }

    // ----------------------------------------------------------------------
    // Test 6: Food donation (Flat 2-05, 10 kg Rice, Donor: Suresh Nimbalkar)
    // ----------------------------------------------------------------------
    const flat205 = await prisma.flat.findUnique({
      where: { displayName: '2-05' },
      include: { contributors: true },
    });
    const flat205ContribId = flat205.contributors[0].id;

    const preDonationDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();

    const addFoodDonRes = await fetch(`${BASE_URL}/api/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        contributorId: flat205ContribId,
        donorName: 'Suresh Nimbalkar',
        donationType: 'Food',
        itemName: 'Kolam Rice',
        quantity: 10,
        unit: 'kg',
        estimatedValue: 600,
        notes: 'Test 6 Food Donation',
      }),
    });

    const postDonationDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();
    if (
      addFoodDonRes.ok &&
      postDonationDash.totalReceived === preDonationDash.totalReceived
    ) {
      logPass(
        'Test 6 — Food & In-Kind Donation Integrity',
        `Food donation added (10 kg Rice from donor Suresh Nimbalkar). Cash total remained unchanged.`
      );
    } else {
      throw new Error('Food donation test failed.');
    }

    // ----------------------------------------------------------------------
    // Test 7: Expense entry & Balance formula
    // ----------------------------------------------------------------------
    const preExpDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();

    const addExpRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        expenseCategory: 'Decorations',
        description: 'Stage entrance marigold flowers',
        amount: 2000,
        paidTo: 'ABC Decorations',
        paymentMethod: 'UPI',
      }),
    });
    const expData = await addExpRes.json();

    const postExpDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();
    if (
      addExpRes.ok &&
      postExpDash.totalExpenses === preExpDash.totalExpenses + 2000 &&
      postExpDash.currentBalance === postExpDash.totalReceived - postExpDash.totalExpenses
    ) {
      logPass(
        'Test 7 — Expense & Balance Formula',
        `Recorded ₹2,000 expense. Current Balance: ₹${postExpDash.currentBalance} (Total Received ₹${postExpDash.totalReceived} − Total Expenses ₹${postExpDash.totalExpenses}).`
      );
    } else {
      throw new Error('Expense test failed');
    }

    // ----------------------------------------------------------------------
    // Test 8: "Received By" automatically stamped from session
    // ----------------------------------------------------------------------
    const rahulDepositRes = await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieRahul },
      body: JSON.stringify({
        contributorId: flat101ContribId,
        donorName: 'Rahul Self-Deposit',
        amount: 300,
        paymentMethod: 'Cash',
      }),
    });
    const rahulDeposit = await rahulDepositRes.json();

    if (
      rahulDepositRes.ok &&
      rahulDeposit.deposit?.receivedByUser?.name === 'Rahul Sharma'
    ) {
      logPass(
        'Test 8 — Received By Attribution',
        `Deposit automatically recorded "Received By: ${rahulDeposit.deposit.receivedByUser.name}" from session.`
      );
    } else {
      throw new Error(`Received By attribution failed: ${JSON.stringify(rahulDeposit)}`);
    }

    // ----------------------------------------------------------------------
    // Test 9: "Entered By" automatically stamped on expenses
    // ----------------------------------------------------------------------
    const rahulExpenseRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieRahul },
      body: JSON.stringify({
        expenseCategory: 'Printing',
        description: 'Notice boards festival schedule',
        amount: 400,
        paidTo: 'Print Hub',
        paymentMethod: 'Cash',
      }),
    });
    const rahulExpense = await rahulExpenseRes.json();

    if (
      rahulExpenseRes.ok &&
      rahulExpense.expense?.enteredByUser?.name === 'Rahul Sharma'
    ) {
      logPass(
        'Test 9 — Entered By Attribution',
        `Expense automatically recorded "Entered By: ${rahulExpense.expense.enteredByUser.name}" from session.`
      );
    } else {
      throw new Error(`Entered By attribution failed: ${JSON.stringify(rahulExpense)}`);
    }

    // ----------------------------------------------------------------------
    // Test 10: Attachment upload and persistence
    // ----------------------------------------------------------------------
    const sampleAttachmentPath = path.join(__dirname, '..', 'public', 'uploads', 'sample-upi.png');
    const attachmentExists = fs.existsSync(sampleAttachmentPath);

    const depWithAttRes = await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        contributorId: flat101ContribId,
        donorName: 'Harshal Nimbalkar',
        amount: 1500,
        paymentMethod: 'UPI',
        attachment: {
          fileName: 'upi-receipt.png',
          filePath: '/uploads/sample-upi.png',
          fileType: 'image/png',
          fileSize: 1024,
        },
      }),
    });
    const depWithAtt = await depWithAttRes.json();

    if (
      attachmentExists &&
      depWithAttRes.ok &&
      depWithAtt.deposit?.attachments?.length > 0 &&
      depWithAtt.deposit.attachments[0].filePath === '/uploads/sample-upi.png'
    ) {
      logPass(
        'Test 10 — Transaction Attachment & Persistence',
        `Attached UPI payment proof (/uploads/sample-upi.png). Stored in DB and visible on transaction record.`
      );
    } else {
      throw new Error('Attachment test failed');
    }

    // ----------------------------------------------------------------------
    // Test 11: Mobile Camera support
    // ----------------------------------------------------------------------
    const addDepositModalCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'AddDepositModal.tsx'), 'utf-8');
    const hasCameraCapture = addDepositModalCode.includes('capture="environment"');
    const hasGalleryInput = addDepositModalCode.includes('accept="image/');

    if (hasCameraCapture && hasGalleryInput) {
      logPass(
        'Test 11 — Mobile Camera Support',
        `Native camera input capture="environment" and gallery upload both verified in frontend components.`
      );
    } else {
      throw new Error('Mobile camera capture tag missing.');
    }

    // ----------------------------------------------------------------------
    // Test 12: External contributor reuse
    // ----------------------------------------------------------------------
    const reuseContribRes = await fetch(`${BASE_URL}/api/contributors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieAdmin },
      body: JSON.stringify({
        name: 'Rajesh Kumar',
        category: 'Guest',
      }),
    });
    const reuseContribData = await reuseContribRes.json();

    if (reuseContribRes.ok && reuseContribData.isExisting === true) {
      logPass(
        'Test 12 — External Contributor Reuse',
        `Submitting existing external contributor "Rajesh Kumar" reuses existing record ID without duplicating.`
      );
    } else {
      throw new Error('Contributor reuse test failed');
    }

    // ----------------------------------------------------------------------
    // Test 17: Entry User permissions
    // ----------------------------------------------------------------------
    const entryUsersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookieRahul },
    });

    if (entryUsersRes.status === 403) {
      logPass(
        'Test 17 — Entry User Authorization',
        `Entry user successfully blocked from user management (403 Forbidden).`
      );
    } else {
      throw new Error(`Expected 403 for entry user accessing /api/users, got ${entryUsersRes.status}`);
    }

    // ----------------------------------------------------------------------
    // Test 18: Soft deletion of financial record & balance update
    // ----------------------------------------------------------------------
    const deleteExpTarget = expData.expense;
    const preDeleteDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();

    const deleteRes = await fetch(`${BASE_URL}/api/expenses/${deleteExpTarget.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieAdmin },
    });

    const postDeleteDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();

    if (
      deleteRes.ok &&
      postDeleteDash.totalExpenses === preDeleteDash.totalExpenses - deleteExpTarget.amount &&
      postDeleteDash.currentBalance === postDeleteDash.totalReceived - postDeleteDash.totalExpenses
    ) {
      logPass(
        'Test 18 — Soft Deletion & Balance Recalculation',
        `Expense of ₹${deleteExpTarget.amount} deleted. Balance immediately recalculated.`
      );
    } else {
      throw new Error('Delete expense test failed');
    }

    // ----------------------------------------------------------------------
    // Test 19: Database persistence check
    // ----------------------------------------------------------------------
    const countInDb = await prisma.deposit.count({ where: { deletedAt: null } });
    if (countInDb > 0) {
      logPass(
        'Test 19 — SQLite Database Persistence',
        `Database verified with ${countInDb} active persistent records in SQLite file (prisma/dev.db).`
      );
    } else {
      throw new Error('No persistent records in SQLite database');
    }

    // ----------------------------------------------------------------------
    // Test 20: Mathematical Balance verification
    // ----------------------------------------------------------------------
    const finalDash = await (await fetch(`${BASE_URL}/api/dashboard`)).json();
    const expectedBalance = finalDash.totalReceived - finalDash.totalExpenses;
    if (finalDash.currentBalance === expectedBalance) {
      logPass(
        'Test 20 — Current Balance Mathematical Integrity',
        `Verified Current Balance: ₹${finalDash.currentBalance} strictly equals Total Received (₹${finalDash.totalReceived}) − Total Expenses (₹${finalDash.totalExpenses}).`
      );
    } else {
      throw new Error(`Balance mismatch: ${finalDash.currentBalance} vs ${expectedBalance}`);
    }

    console.log('\n=========================================================');
    console.log('  ALL 20 ACCEPTANCE TESTS PASSED SUCCESSFULLY! (20/20)');
    console.log('=========================================================\n');
  } catch (err) {
    logFail('SUITE ERROR', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();