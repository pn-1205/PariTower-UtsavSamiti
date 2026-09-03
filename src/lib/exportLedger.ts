import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatCurrency } from './utils';

export interface LedgerItem {
  id: string;
  kind: 'deposit' | 'expense' | 'donation';
  festival?: string;
  date: string | Date;
  title: string;
  party: string;
  category: string;
  amount: number;
  paymentMethod: string;
  user: string;
  notes?: string;
}

export function getLedgerFilename(extension: 'xlsx' | 'pdf' | 'csv', options?: { festival?: string; fy?: string }): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const festPrefix = options?.festival && options.festival !== 'all' ? `${options.festival.replace(/\s+/g, '_')}_` : '';
  const fySuffix = options?.fy && options.fy !== 'all' ? `_FY_${options.fy}` : '';
  return `${festPrefix}Ledger${fySuffix}_as_on_${day}_${month}_${year}.${extension}`;
}

export function exportLedgerToCsv(transactions: LedgerItem[], options?: { festival?: string; fy?: string }) {
  const filename = getLedgerFilename('csv', options);
  const headers = [
    'Sr. No.',
    'Date',
    'Festival',
    'Transaction Type',
    'Party / Donor',
    'Category',
    'Income (+ INR)',
    'Expense (- INR)',
    'Payment Method',
    'Handled / Entered By',
    'Notes / Purpose',
  ];

  const rows = transactions.map((t, idx) => [
    idx + 1,
    formatDate(t.date),
    `"${(t.festival || 'Ganesh Festival').replace(/"/g, '""')}"`,
    t.kind === 'deposit' ? 'INCOME (+)' : t.kind === 'expense' ? 'EXPENSE (-)' : 'IN-KIND DONATION',
    `"${(t.party || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.kind === 'deposit' ? t.amount : 0,
    t.kind === 'expense' ? Math.abs(t.amount) : 0,
    `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
    `"${(t.user || '').replace(/"/g, '""')}"`,
    `"${(t.notes || t.title || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLedgerToExcel(
  transactions: LedgerItem[],
  summary?: { totalReceived: number; totalExpenses: number; currentBalance: number },
  options?: { festival?: string; fy?: string }
) {
  const filename = getLedgerFilename('xlsx', options);
  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const totRec = summary ? summary.totalReceived : transactions.filter(t => t.kind === 'deposit').reduce((acc, t) => acc + t.amount, 0);
  const totExp = summary ? summary.totalExpenses : transactions.filter(t => t.kind === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const bal = summary ? summary.currentBalance : (totRec - totExp);

  const mainTitle = options?.festival && options.festival !== 'all' 
    ? `PARI TOWER UTSAV SAMITI — ${options.festival.toUpperCase()}` 
    : 'PARI TOWER UTSAV SAMITI (PTUS)';
  const subTitle = `OFFICIAL GENERAL LEDGER ${options?.fy && options.fy !== 'all' ? `(FY ${options.fy})` : ''} — AS ON ${nowStr.toUpperCase()}`;

  // Build Sheet Data
  const sheetData: any[][] = [
    [mainTitle],
    [subTitle],
    [''],
    ['FINANCIAL SUMMARY STATEMENT'],
    ['Total Money Received (INR)', totRec],
    ['Total Expenses (INR)', totExp],
    ['Current Net Balance (INR)', bal],
    [''],
    [
      'Sr. No.',
      'Date',
      'Festival',
      'Transaction Type',
      'Donor / Party Name',
      'Category',
      'Income (+ INR)',
      'Expense (- INR)',
      'Payment Method',
      'Handled / Entered By',
      'Notes & Remarks',
    ],
  ];

  transactions.forEach((t, idx) => {
    const isDeposit = t.kind === 'deposit';
    const isExpense = t.kind === 'expense';

    sheetData.push([
      idx + 1,
      formatDate(t.date),
      t.festival || 'Ganesh Festival',
      isDeposit ? 'INCOME (+)' : isExpense ? 'EXPENSE (-)' : 'IN-KIND DONATION',
      t.party,
      t.category,
      isDeposit ? t.amount : 0,
      isExpense ? Math.abs(t.amount) : 0,
      t.paymentMethod || 'N/A',
      t.user || 'N/A',
      t.notes || t.title || '',
    ]);
  });

  // Footer Totals row
  sheetData.push(['']);
  sheetData.push([
    'TOTALS',
    '',
    '',
    '',
    '',
    '',
    totRec,
    totExp,
    `NET BALANCE: ${bal}`,
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 14 }, // Date
    { wch: 20 }, // Festival
    { wch: 18 }, // Type
    { wch: 30 }, // Party / Donor
    { wch: 22 }, // Category
    { wch: 16 }, // Income
    { wch: 16 }, // Expense
    { wch: 16 }, // Payment Method
    { wch: 20 }, // User
    { wch: 40 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'General Ledger');

  XLSX.writeFile(wb, filename);
}

export function exportLedgerToPdf(
  transactions: LedgerItem[],
  summary?: { totalReceived: number; totalExpenses: number; currentBalance: number },
  options?: { festival?: string; fy?: string }
) {
  const filename = getLedgerFilename('pdf', options);
  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totRec = summary ? summary.totalReceived : transactions.filter(t => t.kind === 'deposit').reduce((acc, t) => acc + t.amount, 0);
  const totExp = summary ? summary.totalExpenses : transactions.filter(t => t.kind === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const bal = summary ? summary.currentBalance : (totRec - totExp);

  // Landscape A4 for rich accounting view
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Decorative Brand Bar (Sacred Deep Maroon)
  doc.setFillColor(136, 19, 55); // Deep Maroon #881337
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleText = options?.festival && options.festival !== 'all' 
    ? `PARI TOWER UTSAV SAMITI — ${options.festival.toUpperCase()}` 
    : 'PARI TOWER UTSAV SAMITI (PTUS)';
  doc.text(titleText, 24, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const subTitleText = `Official Financial General Ledger ${options?.fy && options.fy !== 'all' ? `(FY ${options.fy})` : ''}`;
  doc.text(subTitleText, 24, 42);

  const asOnText = `Ledger As On: ${nowStr}`;
  const asOnWidth = doc.getTextWidth(asOnText);
  doc.text(asOnText, pageWidth - asOnWidth - 24, 32);

  // 2. Financial Summary Cards
  const cardY = 64;
  const cardWidth = (pageWidth - 48 - 24) / 3;
  const cardHeight = 44;

  // Received Card
  doc.setFillColor(240, 253, 244); // light emerald #f0fdf4
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(24, cardY, cardWidth, cardHeight, 6, 6, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL MONEY RECEIVED', 34, cardY + 16);
  doc.setFontSize(14);
  doc.text(formatCurrency(totRec), 34, cardY + 34);

  // Expenses Card
  const expCardX = 24 + cardWidth + 12;
  doc.setFillColor(255, 241, 242); // light rose #fff1f2
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(expCardX, cardY, cardWidth, cardHeight, 6, 6, 'FD');
  doc.setTextColor(159, 18, 57);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL EXPENSES PAID', expCardX + 10, cardY + 16);
  doc.setFontSize(14);
  doc.text(formatCurrency(totExp), expCardX + 10, cardY + 34);

  // Net Balance Card
  const balCardX = expCardX + cardWidth + 12;
  doc.setFillColor(255, 247, 237); // light amber
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(balCardX, cardY, cardWidth, cardHeight, 6, 6, 'FD');
  doc.setTextColor(154, 52, 18);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CURRENT NET CASH BALANCE', balCardX + 10, cardY + 16);
  doc.setFontSize(14);
  doc.text(formatCurrency(bal), balCardX + 10, cardY + 34);

  // 3. Transactions Table
  const tableRows = transactions.map((t, index) => {
    const isDeposit = t.kind === 'deposit';
    const isExpense = t.kind === 'expense';
    const typeLabel = isDeposit ? 'INCOME (+)' : isExpense ? 'EXPENSE (-)' : 'IN-KIND';
    const amountFormatted = isDeposit
      ? `+${formatCurrency(t.amount)}`
      : isExpense
      ? `-${formatCurrency(Math.abs(t.amount))}`
      : 'In-Kind';

    return [
      String(index + 1),
      formatDate(t.date),
      t.festival || 'Ganesh Festival',
      typeLabel,
      t.party || '-',
      t.category || '-',
      amountFormatted,
      t.paymentMethod || '-',
      t.user || '-',
      t.notes || t.title || '-',
    ];
  });

  autoTable(doc, {
    startY: 120,
    margin: { left: 24, right: 24, bottom: 30 },
    head: [[
      '#',
      'Date',
      'Festival',
      'Type',
      'Donor / Party',
      'Category',
      'Amount (INR)',
      'Payment',
      'Handled By',
      'Notes / Purpose',
    ]],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [136, 19, 55], // Sacred Maroon #881337
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 46 },
      2: { cellWidth: 70 },
      3: { cellWidth: 55, fontStyle: 'bold' },
      4: { cellWidth: 120, fontStyle: 'bold' },
      5: { cellWidth: 80 },
      6: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 60 },
      8: { cellWidth: 70 },
      9: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = transactions[data.row.index];
        if (row) {
          if (data.column.index === 2 || data.column.index === 5) {
            if (row.kind === 'deposit') {
              data.cell.styles.textColor = [4, 120, 87]; // emerald
            } else if (row.kind === 'expense') {
              data.cell.styles.textColor = [190, 18, 60]; // rose
            } else {
              data.cell.styles.textColor = [180, 83, 9]; // amber
            }
          }
        }
      }
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.pages.length - 1;
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = `Pari Tower Utsav Samiti • Official Audit Ledger • Page ${currentPage} of ${pageCount}`;
      doc.text(footerText, 24, doc.internal.pageSize.getHeight() - 12);
    },
  });

  doc.save(filename);
}
// ==========================================
// DEPOSITS / MONEY RECEIVED SPECIFIC EXPORTS
// ==========================================

export function exportDepositsToExcel(deposits: any[], totalAmount?: number) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const filename = `Money_Received_as_on_${day}_${month}_${year}.xlsx`;

  const total = totalAmount ?? deposits.reduce((acc, d) => acc + d.amount, 0);

  const sheetData: any[][] = [
    ['PARI TOWER UTSAV SAMITI (PTUS)'],
    [`OFFICIAL MONEY RECEIVED (DEPOSITS) STATEMENT — AS ON ${day} ${month.toUpperCase()} ${year}`],
    [''],
    ['TOTAL MONEY RECEIVED (INR)', total],
    ['TOTAL TRANSACTIONS RECORDED', deposits.length],
    [''],
    [
      'Sr. No.',
      'Date',
      'Flat / Contributor',
      'Donor Name',
      'Amount (INR)',
      'Payment Method',
      'Received By',
      'Notes & Remarks',
    ],
  ];

  deposits.forEach((d, idx) => {
    const flatStr = d.contributor?.flat
      ? `Flat ${d.contributor.flat.altName || d.contributor.flat.displayName.replace('-', '')}`
      : d.contributor?.name || 'External';
    sheetData.push([
      idx + 1,
      formatDate(d.receivedDate),
      flatStr,
      d.donorName || d.contributor?.name || 'Anonymous',
      d.amount,
      d.paymentMethod || 'Cash',
      d.receivedByUser?.name || 'Committee',
      d.notes || '',
    ]);
  });

  sheetData.push(['']);
  sheetData.push(['TOTAL', '', '', '', total, '', '', '']);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 14 }, // Date
    { wch: 20 }, // Flat / Contributor
    { wch: 26 }, // Donor Name
    { wch: 16 }, // Amount
    { wch: 16 }, // Method
    { wch: 20 }, // Received By
    { wch: 35 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Money Received');
  XLSX.writeFile(wb, filename);
}

export function exportDepositsToPdf(deposits: any[], totalAmount?: number) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const filename = `Money_Received_as_on_${day}_${month}_${year}.pdf`;

  const total = totalAmount ?? deposits.reduce((acc, d) => acc + d.amount, 0);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner (Emerald/Green theme for income)
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PARI TOWER UTSAV SAMITI (PTUS)', 24, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Official Money Received (Deposits) Statement', 24, 42);

  const asOnText = `As On: ${day} ${month} ${year}`;
  const asOnWidth = doc.getTextWidth(asOnText);
  doc.text(asOnText, pageWidth - asOnWidth - 24, 32);

  // Summary Card
  const cardY = 64;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(24, cardY, 260, 44, 6, 6, 'FD');
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL MONEY RECEIVED', 34, cardY + 16);
  doc.setFontSize(14);
  doc.text(formatCurrency(total), 34, cardY + 34);

  const tableRows = deposits.map((d, index) => {
    const flatStr = d.contributor?.flat
      ? `Flat ${d.contributor.flat.altName || d.contributor.flat.displayName.replace('-', '')}`
      : d.contributor?.name || 'External';

    return [
      String(index + 1),
      formatDate(d.receivedDate),
      flatStr,
      d.donorName || d.contributor?.name || '-',
      formatCurrency(d.amount),
      d.paymentMethod || 'Cash',
      d.receivedByUser?.name || '-',
      d.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 120,
    margin: { left: 24, right: 24, bottom: 30 },
    head: [[
      '#',
      'Date',
      'Flat / Unit',
      'Donor Name',
      'Amount (INR)',
      'Method',
      'Received By',
      'Notes & Remarks',
    ]],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 55 },
      2: { cellWidth: 70, fontStyle: 'bold' },
      3: { cellWidth: 150, fontStyle: 'bold' },
      4: { cellWidth: 80, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
      5: { cellWidth: 65 },
      6: { cellWidth: 90 },
      7: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.pages.length - 1;
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = `Pari Tower Utsav Samiti • Money Received Audit Statement • Page ${currentPage} of ${pageCount}`;
      doc.text(footerText, 24, doc.internal.pageSize.getHeight() - 12);
    },
  });

  doc.save(filename);
}

// ==========================================
// EXPENSES SPECIFIC EXPORTS
// ==========================================

export function exportExpensesToExcel(expenses: any[], totalAmount?: number) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const filename = `Expenses_as_on_${day}_${month}_${year}.xlsx`;

  const total = totalAmount ?? expenses.reduce((acc, e) => acc + e.amount, 0);

  const sheetData: any[][] = [
    ['PARI TOWER UTSAV SAMITI (PTUS)'],
    [`OFFICIAL FESTIVAL EXPENSES STATEMENT — AS ON ${day} ${month.toUpperCase()} ${year}`],
    [''],
    ['TOTAL EXPENSES PAID (INR)', total],
    ['TOTAL EXPENSE VOUCHERS', expenses.length],
    [''],
    [
      'Sr. No.',
      'Date',
      'Category',
      'Paid To / Vendor',
      'Description / Purpose',
      'Amount (INR)',
      'Payment Method',
      'Entered By',
    ],
  ];

  expenses.forEach((e, idx) => {
    sheetData.push([
      idx + 1,
      formatDate(e.expenseDate),
      e.expenseCategory,
      e.paidTo,
      e.description,
      e.amount,
      e.paymentMethod || 'Cash',
      e.enteredByUser?.name || 'Committee',
    ]);
  });

  sheetData.push(['']);
  sheetData.push(['TOTAL', '', '', '', '', total, '', '']);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 14 }, // Date
    { wch: 20 }, // Category
    { wch: 26 }, // Paid To
    { wch: 35 }, // Description
    { wch: 16 }, // Amount
    { wch: 16 }, // Method
    { wch: 20 }, // Entered By
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Festival Expenses');
  XLSX.writeFile(wb, filename);
}

export function exportExpensesToPdf(expenses: any[], totalAmount?: number) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const filename = `Expenses_as_on_${day}_${month}_${year}.pdf`;

  const total = totalAmount ?? expenses.reduce((acc, e) => acc + e.amount, 0);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner (Rose/Crimson theme for expenses)
  doc.setFillColor(225, 29, 72); // rose-600
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PARI TOWER UTSAV SAMITI (PTUS)', 24, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Official Festival Expenses Statement', 24, 42);

  const asOnText = `As On: ${day} ${month} ${year}`;
  const asOnWidth = doc.getTextWidth(asOnText);
  doc.text(asOnText, pageWidth - asOnWidth - 24, 32);

  // Summary Card
  const cardY = 64;
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(24, cardY, 260, 44, 6, 6, 'FD');
  doc.setTextColor(159, 18, 57);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL EXPENSES PAID', 34, cardY + 16);
  doc.setFontSize(14);
  doc.text(formatCurrency(total), 34, cardY + 34);

  const tableRows = expenses.map((e, index) => {
    return [
      String(index + 1),
      formatDate(e.expenseDate),
      e.expenseCategory,
      e.paidTo,
      e.description,
      formatCurrency(e.amount),
      e.paymentMethod || 'Cash',
      e.enteredByUser?.name || '-',
    ];
  });

  autoTable(doc, {
    startY: 120,
    margin: { left: 24, right: 24, bottom: 30 },
    head: [[
      '#',
      'Date',
      'Category',
      'Paid To / Vendor',
      'Description / Purpose',
      'Amount (INR)',
      'Method',
      'Entered By',
    ]],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 55 },
      2: { cellWidth: 80, fontStyle: 'bold' },
      3: { cellWidth: 120, fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 80, halign: 'right', fontStyle: 'bold', textColor: [190, 18, 60] },
      6: { cellWidth: 65 },
      7: { cellWidth: 85 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.pages.length - 1;
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerText = `Pari Tower Utsav Samiti • Festival Expenses Audit Statement • Page ${currentPage} of ${pageCount}`;
      doc.text(footerText, 24, doc.internal.pageSize.getHeight() - 12);
    },
  });

  doc.save(filename);
}