export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureFestivalRegistered } from '@/lib/festivalServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      amount,
      donorName,
      festival,
      flatId,
      contributorName,
      contributorCategory = 'Resident',
      paymentAccountId,
      utrNumber,
      phone,
      notes,
    } = body;

    // 1. Validate Amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid donation amount greater than 0.' }, { status: 400 });
    }

    // 2. Validate Donor Name
    if (!donorName || !donorName.trim()) {
      return NextResponse.json({ error: 'Donor name is required.' }, { status: 400 });
    }

    // 3. Validate UTR / Reference Number
    const cleanUtr = (utrNumber || '').trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      return NextResponse.json({ error: 'Please enter a valid 12-digit UPI Transaction Ref / UTR number.' }, { status: 400 });
    }

    // 4. Ensure Festival Registered
    const validFestival = await ensureFestivalRegistered(festival);

    // 5. Connect Contributor (Flat or Other)
    let contributor: any = null;
    if (flatId) {
      contributor = await prisma.contributor.findFirst({
        where: { flatId },
        include: { flat: true },
      });

      if (!contributor) {
        const flat = await prisma.flat.findUnique({ where: { id: flatId } });
        if (flat) {
          contributor = await prisma.contributor.create({
            data: {
              contributorType: 'flat',
              flatId: flat.id,
              name: flat.altName ? `Flat ${flat.altName}` : flat.displayName,
              category: 'Resident',
            },
            include: { flat: true },
          });
        }
      }
    }

    if (!contributor) {
      const cleanName = (contributorName || donorName).trim();
      contributor = await prisma.contributor.findFirst({
        where: { name: cleanName, contributorType: 'other' },
      });

      if (!contributor) {
        contributor = await prisma.contributor.create({
          data: {
            contributorType: 'other',
            name: cleanName,
            category: contributorCategory || 'Well-wisher',
            phone: phone?.trim() || null,
          },
        });
      }
    }

    // 6. Resolve Receiving PaymentAccount
    let targetAccount = null;
    if (paymentAccountId) {
      targetAccount = await prisma.paymentAccount.findUnique({
        where: { id: paymentAccountId },
      });
    }

    if (!targetAccount) {
      targetAccount = await prisma.paymentAccount.findFirst({
        where: { isActive: true, isDefault: true },
      });
    }

    if (!targetAccount) {
      targetAccount = await prisma.paymentAccount.findFirst({
        where: { isActive: true },
      });
    }

    // 7. Format notes
    const noteParts = [`[Online UPI Donation - UTR: ${cleanUtr}]`];
    if (targetAccount) {
      noteParts.push(`Paid to: ${targetAccount.name}`);
    }
    if (phone?.trim()) {
      noteParts.push(`Phone: ${phone.trim()}`);
    }
    if (notes?.trim()) {
      noteParts.push(`Note: ${notes.trim()}`);
    }

    // 8. Create Deposit record in PENDING_VERIFICATION state
    const deposit = await prisma.deposit.create({
      data: {
        festival: validFestival,
        contributorId: contributor.id,
        donorName: donorName.trim(),
        amount: parsedAmount,
        paymentMethod: 'UPI',
        status: 'PENDING_VERIFICATION',
        utrNumber: cleanUtr,
        paymentAccountId: targetAccount?.id || null,
        receivedByUserId: null,
        receivedDate: new Date(),
        notes: noteParts.join(' | '),
      },
      include: {
        contributor: {
          include: { flat: true },
        },
        paymentAccount: true,
      },
    });

    const receiptNo = `PTUS-${new Date().getFullYear()}-${deposit.id.slice(-6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      depositId: deposit.id,
      receiptNo,
      deposit,
      message: 'Donation submitted successfully. It will appear on the general ledger once verified by the committee.',
    });
  } catch (error: any) {
    console.error('Error submitting donation:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit donation.' }, { status: 500 });
  }
}