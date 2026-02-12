

## Plan: Multiple Improvements Across Dashboard Pages

This plan covers 5 changes requested:

### 1. Prevent Duplicate Accounts in Account Details Upload

Currently, the Account Details page already checks for duplicates during file upload (lines 211-218 in AccountDetails.tsx). However, the manual "Add" form also checks for duplicates (line 265-274). This logic is already in place and working.

**Action:** Verify the existing duplicate prevention is solid. Add a unique constraint on `account_number` in the `account_details` table via a database migration so duplicates are enforced at the database level too.

---

### 2. Auto-Save to Account Details from "Accounts Opened" (OtherBankingServices)

The Accounts Opened page (OtherBankingServices.tsx) already has code to save to `account_details` using `upsert` with `onConflict: 'account_number'` (lines 171-188). However, there is **no unique constraint** on `account_number` in the `account_details` table, which means the upsert silently fails.

**Actions:**
- Create a database migration to add a **unique constraint** on `account_details.account_number`.
- This will make the existing upsert code in OtherBankingServices work correctly, automatically saving customer data (name, account number, aadhar number) to Account Details whenever a new account is opened.

---

### 3. Remove DLC Block from Non-Financial Services

The standalone DLC page (`/dlc`) will be removed since DLC functionality already exists within the Social Security page as a scheme option.

**Actions:**
- Remove the DLC route from `App.tsx` (line 69).
- Remove the DLC sidebar entry from `Sidebar.tsx` (line 174).
- Delete the `src/pages/DLC.tsx` file.
- Remove the DLC import from `App.tsx` (line 38).

---

### 4. Consistent Theme Colors for All Page Headings

Some pages use `PageWrapper` (which has its own heading style) and some use `PageHeader` (which uses sidebar theme colors). The goal is to make all headings look consistent.

**Actions:**
- Update `PageWrapper` component to use the same sidebar-themed styling (`bg-sidebar`, `text-sidebar-foreground`) for its header section, matching the `PageHeader` component's appearance.
- This will automatically apply to all pages using `PageWrapper` (Banking, Social Security, Expenses, Applications, etc.).

---

### 5. Align Print, Download, and Browse Inline in Banking Transaction

Currently in Banking.tsx, the Print and Download buttons are in the page header area (action prop), while the Browse CSV/Excel button is inside the form section below. They need to be in one line.

**Actions:**
- Move the Browse CSV/Excel button from inside the form area up to the action bar alongside Print and Download buttons in the `PageWrapper` action prop.
- All three buttons (Print, Download, Browse) will appear inline in the top action bar.

---

### Technical Summary

| Change | Files Affected |
|--------|---------------|
| Unique constraint on account_number | Database migration |
| Remove DLC block | App.tsx, Sidebar.tsx, DLC.tsx (delete) |
| Consistent heading theme | PageWrapper.tsx |
| Banking buttons inline | Banking.tsx |

