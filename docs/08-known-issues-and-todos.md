# 08 — Known Issues & Remaining Work

This document captures everything that is known to be incomplete, imperfect, or deferred. Updated as of 2026-04-28 (Phase 2).

---

## Open issues

### 1. `useContracts` creates multiple listener instances

**Severity:** Medium (cost / performance)  
**File:** `src/modules/cms/hooks/useContracts.ts`

The hook is called independently by each CMS page that mounts, opening duplicate `onSnapshot` listeners.

**Fix:** Lift `useContracts` into a `CMSProvider` context wrapping `CMSLayout` — matching the Finance and Offers patterns.

---

### 2. Dark mode is partially implemented

**Severity:** Low  
**File:** `src/modules/finance/components/Layout.tsx`

Toggle sets `dark` class on `document.documentElement` but Finance components have no `dark:` variants.

---

### 3. Google Drive integration is incomplete

**Severity:** Low  
**File:** `src/modules/cms/services/googleDrive.ts`

OAuth flow and contract preview upload work; Attachments tab files are not synced.

---

### 4. BillingDetailPage Edit button is non-functional

**Severity:** Medium  
**File:** `src/modules/finance/pages/BillingDetailPage.tsx`  
Edit button on draft invoices has no `onClick` handler and no route.

---

### 5. Subscription `billingInterval` field unused

**Severity:** Low  
`Subscription.billingInterval` not consumed by `runBillingJob`.

---

### 6. Payment allocation flow is simplified

**Severity:** Medium (correctness)  
"Record Payment" bypasses `allocatePayment()`; payments won't appear in `allocations[]`.

---

### 7. Workflow tab "تغيير الحالة" navigates to Metadata tab

**Severity:** Low (UX)  
Should open `WorkflowTransitionModal` directly from the workflow tab.

---

### 8. KPI trend values on Dashboard are static

**Severity:** Low (UX)  
`trend` prop on KpiCard is hardcoded. Should compare current vs previous month.

---

### 10. Offers: `expired` status has no inbound transition

**Severity:** Low (arch debt)  
Intended for a scheduled Cloud Function checking `expiry_date < today`.

---

### 11. Offers: `OFFER_WON` event has no subscriber

**Severity:** Low (arch debt)  
Phase 3 will add CMS listener → `CreateContractFromOfferModal` with `linked_contract_id` pre-fill.

---

### 12. GEMINI_API_KEY exposed in client bundle

**Severity:** Crash-class security issue  
**File:** `vite.config.ts`  
`define: { 'process.env.GEMINI_API_KEY': ... }` injects the key into the production bundle.

**Fix:** Remove the `define` block. Rename to `VITE_GEMINI_API_KEY` if client-side use is needed, OR move calls to a server function.

---

### 13. Firestore rules: no field-level restrictions

**Severity:** Medium (security)  
All collections allow full read/write to any authenticated user. `appSettings/invoiceCounter` and `appSettings/offerCounter` can be overwritten by any user.

**Fix:** Add `request.resource.data.keys().hasOnly(['lastSequence'])` constraint for counters. Full RBAC requires Firebase Custom Claims.

---

## Architectural debt

### A. CMS module lacks a shared context
Each CMS page opens its own Firestore listeners. Requires a `CMSProvider` — same pattern as Finance and Offers.

### B. CMS and Finance use separate project registries
`platformBus` contract-signed integration is a workaround for the schema divergence.

### C. No role-based access control
All authenticated users have full read/write. Requires Firebase Custom Claims.

### D. No automated tests
`npm run lint` runs `tsc --noEmit` only.

### E. Offers status labels not settings-driven
Hardcoded in `types.ts`. Phase 2+ will add `offer_settings/general.offer_statuses[]`.

### F. PDF export engine is duplicated across CMS and Offers
`cms/utils/exportPdf.ts` and `offers/utils/exportPdf.ts` are identical. Phase 4 will extract to `src/core/utils/exportPdf.ts` and update both importers.

### G. Offers: no version history
Phase 3 item — `OfferVersion` snapshots on content save, mirroring CMS `ContractVersion`.

---

## Completed items (for reference)

- ✅ `ToastProvider` missing → crash on Subscriptions/Products/ProjectDetail
- ✅ AppContext notification system (wrote to state, never rendered)
- ✅ `useContracts` opened listeners before auth confirmed
- ✅ `CMSDashboard` used `c.created_at` (non-existent field)
- ✅ `PlatformContext` opened duplicate Firestore listeners
- ✅ `ContractsPage` called `useContracts()` twice
- ✅ `CMSClientsPage` and `CMSProjectsPage` called Firestore directly
- ✅ Invoice number race condition (fixed with `runTransaction`)
- ✅ `LoginPage` imported from Finance by AppShell
- ✅ `CounterpartiesPage` used service files instead of AppContext
- ✅ `useContracts` snapshot missing `id: d.id` spread
- ✅ `cms_projects` / `cms_settings` missing from Firestore rules
- ✅ AppContext `getDocs` missing `id: d.id`
- ✅ `SubscriptionForm` hardcoded `legalEntityId: 'default'`
- ✅ `CMSProjectsPage` used English status values
- ✅ `CMSClientsPage` fields didn't match `Client` type
- ✅ `alert()` calls replaced with toast / inline feedback
- ✅ **Contract workflow** — audit trail, roles config, timeline, ContractsList integration (2026-04-19)
- ✅ **Finance i18n** — Dashboard real data, ProjectListPage, ProjectDetailPage fully bilingual (2026-04-20)
- ✅ **Offers Phase 0** — OffersProvider, atomic numbering, subcollections, rules (2026-04-28)
- ✅ **Offers Phase 1** — WorkflowAssignee, OfferTransitionModal, OfferNoteModal, OffersSettingsContext, system note batched (2026-04-28)
- ✅ **Offers Phase 2** — OfferPreviewPortal (bilingual, section-type-aware), exportOfferToPdf (html2canvas+jsPDF with oklch resolver), Preview + PDF buttons in OfferBuilderPage top bar (2026-04-28)
