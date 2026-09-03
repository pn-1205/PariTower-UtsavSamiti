
---

## 7. Latest Enhancements (Flat Selection, Compulsory Donor Name, PDF & Excel Ledger)

1. **Flat Selection & Pure Number Autocomplete**:
   - In **Add Deposit** and **Add Donation** dialogs, the flat input now features a fixed `Flat No. -` prefix badge.
   - Suggestions strictly display pure numbers without hyphens or resident names (`101`, `102`, `103`, `808`, `1419`).
   - Interactive text entry: typing `808` instantly resolves and selects Flat 808.

2. **Compulsory "Name of the Donor" Field**:
   - A required text field `Name of the Donor *` is added to both Deposit and Donation entries.
   - Allows recording multiple entries from the same flat with different individual donors (e.g., family members or tenants), as well as multiple entries from donors.
   - Displayed clearly on individual transaction cards, the General Ledger, and the Flat Contribution History.

3. **Export Ledger as on Date (PDF & Excel)**:
   - Added to the Unified General Ledger (`/transactions`):
     - **Export Ledger (.xlsx)**: Downloads `Ledger_as_on_DD_MMM_YYYY.xlsx` formatted with PTFC header, financial summary KPIs, formatted currency, and clean column widths.
     - **Export Ledger (.pdf)**: Downloads `Ledger_as_on_DD_MMM_YYYY.pdf` rendered in landscape orientation with deep saffron PTFC header, financial summary KPI cards, striped table formatting, color-coded Income (+) / Expense (−), and audit page footers.

4. **100% Free Hosting Architecture**:
   - Step-by-step free hosting guide created in `FREE_HOSTING_GUIDE.md` covering **Vercel + Turso** (Cloud SQLite) and **Render.com**.