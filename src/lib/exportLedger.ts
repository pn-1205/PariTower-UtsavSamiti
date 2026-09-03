import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatCurrency } from './utils';

export interface LedgerItem {
  id: string;
  kind: 'deposit' | 'expense' | 'donation';
  date: string | Date;
  title: string;
  party: string;
  category: string;
  amount: number;
  paymentMethod: string;
  user: string;
  notes?: string;
}

export function getLedgerFilename(extension: 'xlsx' | 'pdf' | 'csv'): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `Ledger_as_on_${day}_${month}_${year}.${extension}`;
}

export function exportLedgerToCsv(transactions: LedgerItem[]) {
  const filename = getLedgerFilename('csv');
  const headers = [
    'Sr. No.',
    'Date',
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
  summary?: { totalReceived: number; totalExpenses: number; currentBalance: number }
) {
  const filename = getLedgerFilename('xlsx');
  const nowStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const totRec = summary ? summary.totalReceived : transactions.filter(t => t.kind === 'deposit').reduce((acc, t) => acc + t.amount, 0);
  const totExp = summary ? summary.totalExpenses : transactions.filter(t => t.kind === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const bal = summary ? summary.currentBalance : (totRec - totExp);

  // Build Sheet Data
  const sheetData: any[][] = [
    ['PARI TOWER UTSAV SAMITI (PTUS)'],
    [`OFFICIAL FINANCIAL GENERAL LEDGER — AS ON ${nowStr.toUpperCase()}`],
    [''],
    ['FINANCIAL SUMMARY STATEMENT'],
    ['Total Money Received (INR)', totRec],
    ['Total Expenses (INR)', totExp],
    ['Current Net Balance (INR)', bal],
    [''],
    [
      'Sr. No.',
      'Date',
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
  summary?: { totalReceived: number; totalExpenses: number; currentBalance: number }
) {
  const filename = getLedgerFilename('pdf');
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

  // 1. Top Decorative Brand Bar
  doc.setFillColor(234, 88, 12); // Deep saffron/orange #ea580c
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PARI TOWER UTSAV SAMITI (PTUS)', 24, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Official Financial General Ledger', 24, 42);

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
  doc.setFillColor(255, 247, 237); // light orange #fff7ed
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
      fillColor: [234, 88, 12],
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
      0: { cellWidth: 20 },
      1: { cellWidth: 50 },
      2: { cellWidth: 60, fontStyle: 'bold' },
      3: { cellWidth: 140, fontStyle: 'bold' },
      4: { cellWidth: 90 },
      5: { cellWidth: 75, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 65 },
      7: { cellWidth: 80 },
      8: { cellWidth: 'auto' },
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