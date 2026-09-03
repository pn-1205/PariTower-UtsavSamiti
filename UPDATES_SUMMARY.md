# Pari Tower Festival Committee (PTFC) — Updates & Enhancements Summary

The following adjustments have been implemented:

---

## 1. Renamed "Proof" to "View Attachment"
- All buttons, badges, and table headers across the application now uniformly display **"View Attachment"** (and **"Attachment"** in table headers):
  - **Dashboard Recent Activity**: Buttons now display `View Attachment`.
  - **Money Received (Deposits)**: Table column header changed to `Attachment`, buttons display `View Attachment`.
  - **Expenses Ledger**: Table column header changed to `Attachment`, buttons display `View Attachment`.
  - **In-Kind Donations**: Table column header changed to `Attachment`, buttons display `View Attachment`.
  - **Unified General Ledger**: Badges display `View Attachment`.
  - **Flat Detail Page**: History items display `View Attachment`.

---

## 2. Removed the "Flat Contributions Progress" Section from Dashboard
- As requested with the attached screenshot (`media_1788420757034.png`), the `Flat Contributions Progress` and adjacent in-kind donations row has been completely removed from the main dashboard.
- The dashboard now transitions cleanly from the **Financial Summary Cards** (Total Received, Total Expenses, Current Balance) directly into the **Money Received Breakdown** and **Expenses by Category**, followed by the **Recent Financial Activity Feed**.
- Residents and committee members can still access full flat-by-flat details, search, floor filters, and statuses anytime via the **Flats** directory (`/flats`).

---

## 3. Dynamic External Contributor Addition
- In both `AddDepositModal` and `AddDonationModal`:
  - When selecting **Other Contributor**, users now have a dynamic combo-box input.
  - Users can either pick an existing contributor from the suggestions or **simply type any new name** (e.g. `Kailash Agarwal`, `Shree Ganesh Stores`).
  - If a typed name matches an existing contributor, it automatically links and reuses that contributor without creating duplicates.
  - If a typed name is new, a badge indicates: `✨ New contributor "[Name]" will be dynamically added to the list`.
  - Category (defaults to `Guest`, or select `Sponsor`, `Business/Shop`, `Resident`, etc.) and optional phone number can be set directly inline.
  - The backend (`/api/deposits` and `/api/donations`) automatically resolves or creates the contributor record dynamically on the fly.