## Plan: CKYC Page

### User-facing changes
- Add CKYC under Non Financial Services with Date, Account Number, Name, Address, and optional Mobile Number.
- Provide a form to add records, a list with Edit and Save actions, and a Print option.

### Data and access
- Store CKYC records in a dedicated Supabase table so saved entries are shared and retained.
- Restrict viewing and changes to signed-in admins and managers, matching existing non-financial record access rules.

### Technical details
- Add the `/ckyc` route and sidebar item.
- Create the table with the requested fields and timestamps; grant authenticated access, enable RLS, apply the admin/manager policy, and update `updated_at` automatically.
- Build the page using the existing shared header, table, form, and theme patterns.
