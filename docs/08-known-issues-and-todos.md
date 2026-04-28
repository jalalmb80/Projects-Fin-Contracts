# 08 — Known Issues & Remaining Work

This document captures everything that is known to be incomplete, imperfect, or deferred. Updated as of 2026-04-28.

---

## Open issues

### 1. `useContracts` creates multiple listener instances

**Severity:** Medium (cost / performance)  
**File:** `src/modules/cms/hooks/useContracts.ts`

The hook is called independently by each CMS page that mounts. If two CMS pages are rendered simultaneously, duplicate `onSnapshot` listeners open. This doubles read costs.

**Fix:** Lift `useContracts` into a `CMSProvider` context (similar to AppContext for Finance, and now OffersProvider for Offers) and call it once at the `CMSLayout` level.

---

### 2. Dark mode is partially implemented

**Severity:** Low  
**File:** `src/modules/finance/components/Layout.tsx`

The toggle correctly sets the `dark` class on `document.documentElement`. However, `dark:` variant styles are not defined across Finance components — the toggle works mechanically but has no visual effect.

The CMS and Offers modules are unaffected.

---

### 3. Google Drive integration is incomplete

**Severity:** Low  
**File:** `src/modules/cms/services/googleDrive.ts`

The Google Drive OAuth flow is implemented and the upload button is wired in the contract Preview tab. However, attachments uploaded via the Attachments tab are not synced to Drive.

---

### 4. BillingDetailPage Edit button is non-functional

**Severity:** Medium  
**File:** `src/modules/finance/pages/BillingDetailPage.tsx`

The Edit button on draft invoices renders but has no `onClick` handler and no route.

---

### 5. Subscription `billingInterval` field unused

**Severity:** Low  
**File:** `src/modules/finance/types.ts`

`Subscription.billingInterval` exists in the type but is not consumed by `runBillingJob`. Intended to support `BillingCycle.Custom` intervals — not yet implemented.

---

### 6. Payment allocation flow is simplified

**Severity:** Medium (correctness)  
**File:** `src/modules/finance/pages/BillingDetailPage.tsx`

"Record Payment" creates a payment and updates balance directly, bypassing `allocatePayment()`. Payments recorded this way won’t appear in `payment.allocations[]`.

---

### 7. Workflow tab "تغيير الحالة" button navigates to Metadata tab

**Severity:** Low (UX)  
**File:** `src/modules/cms/components/ContractEditor.tsx`

The "تغيير الحالة" button in the WorkflowTimeline tab navigates the user to the Metadata tab where the status select is located. A future improvement would be to open the `WorkflowTransitionModal` directly from the workflow tab with a status-picker step.

---

### 8. KPI trend values on Dashboard are static

**Severity:** Low (UX)  
**File:** `src/modules/finance/pages/DashboardPage.tsx`

The `trend` prop on KpiCard (e.g. `+12% vs last month`) is hardcoded. A future improvement would compute these by comparing the current month’s total against the previous month.

---

### 9. Offers: system note on transition is not batched with workflow log entry

**Severity:** Low (correctness)  
**File:** `src/modules/offers/pages/OfferBuilderPage.tsx`

In `handleTransition`, `addWorkflowLogEntry` (atomic batch: status + subcollection entry) succeeds, then `addNote` (system note) is a separate write. If the second write fails (offline, network blip), the status changes without a system note in the notes panel.

**Fix (Phase 1):** Extend `addWorkflowLogEntry` to accept an optional `systemNote: OfferNote` and include it in the same `writeBatch`.

---

### 10. Offers: `expired` status has no inbound transition

**Severity:** Low (arch debt)  
**File:** `src/modules/offers/types.ts`

`expired` is defined in `OfferStatus` and `STATUS_LABELS` but no transition leads into it from `ALLOWED_TRANSITIONS`. It is intended to be set by a scheduled Cloud Function that checks `expiry_date < today`. Until that function exists, `expired` is unreachable through the UI.

---

### 11. Offers: `OFFER_WON` event has no subscriber

**Severity:** Low (arch debt)  
**File:** `src/core/events/platformBus.ts`, `src/modules/offers/pages/OfferBuilderPage.tsx`

`platformBus.emit(PLATFORM_EVENTS.OFFER_WON, ...)` fires when an offer is marked as Won. No listener is registered in CMS or Finance. Phase 3 will add a CMS listener that opens a "Create Contract from Offer" modal and pre-fills `linked_contract_id`.

---

### 12. GEMINI_API_KEY exposed in client bundle

**Severity:** Crash-class security issue  
**File:** `vite.config.ts`

`define: { 'process.env.GEMINI_API_KEY': ... }` injects the key directly into the production bundle regardless of whether the variable starts with `VITE_`. If a real Gemini API key is present in `.env.local`, it is visible in the built JavaScript.

**Fix:** Remove the `define` block and rename to `VITE_GEMINI_API_KEY` if client-side access is actually needed, OR move all Gemini calls to a server function that reads the key from process.env.

---

### 13. Firestore rules: no field-level restrictions

**Severity:** Medium (security)  
**File:** `firestore.rules`

All collections allow full read/write to any authenticated user. `appSettings/invoiceCounter` (and now `appSettings/offerCounter`) can be overwritten by any user, bypassing the `runTransaction` safety. No role-based access control exists.

**Fix:** For counters, add a `request.resource.data.keys().hasOnly(['lastSequence'])` constraint. Full RBAC requires Firebase Custom Claims.

---

## Architectural debt

### A. CMS module lacks a shared context

Each CMS page opens its own Firestore listeners. A `CMSProvider` wrapping CMS routes would open listeners once and share data — matching the Finance and Offers module patterns. (Offers fixed this in Phase 0.)

### B. CMS and Finance use separate project registries

A Finance project and a CMS project represent similar real-world entities but use different schemas and collections. The `platformBus` integration (contract signed → billing form pre-filled) is a workaround.

### C. No role-based access control

All authenticated users have full read/write access. Extension requires a `role` field per user in Firestore or Firebase custom claims.

### D. No automated tests

The project has no unit, integration, or E2E tests. `npm run lint` runs `tsc --noEmit` for type checking only.

### E. Offers status labels not settings-driven

Unlike CMS contract statuses (configurable via `cms_settings/general.contract_statuses[]`), offer statuses are hardcoded in `types.ts`. Phase 1 will add `offer_settings/general` with a configurable `offer_statuses[]` array.

### F. Offers: no PDF export, version history, or appendices

All three are Phase 2–3 items tracked in `docs/09-offers-module.md`.

---

## Completed items (for reference)

- ✅ `ToastProvider` missing → crash on Subscriptions/Products/ProjectDetail
- ✅ AppContext notification system (wrote to state, never rendered)
- ✅ `useContracts` opened listeners before auth was confirmed
- ✅ `CMSDashboard` used `c.created_at` (non-existent field)
- ✅ `PlatformContext` opened duplicate Firestore listeners
- ✅ `ContractsPage` called `useContracts()` twice; `setContracts`/`setTemplates` were no-ops
- ✅ `CMSClientsPage` and `CMSProjectsPage` called Firestore directly
- ✅ Invoice number race condition (fixed with `runTransaction`)
- ✅ `LoginPage` was imported from Finance module by AppShell
- ✅ `CounterpartiesPage` / forms used service files instead of AppContext
- ✅ `useContracts` snapshot mapping missing `id: d.id` spread
- ✅ `cms_projects` missing from Firestore rules
- ✅ `cms_settings` missing from Firestore rules
- ✅ AppContext `getDocs` missing `id: d.id` spread
- ✅ `SubscriptionForm` hardcoded `legalEntityId: 'default'`
- ✅ `CMSProjectsPage` used English status values
- ✅ `CMSClientsPage` form fields didn’t match `Client` type
- ✅ `alert()` calls replaced with toast / inline feedback
- ✅ Currency toggle wired to `setDisplayCurrency()`
- ✅ Dark mode toggle wired to `document.documentElement.classList`
- ✅ Dead service files, ProtectedRoute, temp files deleted
- ✅ **Contract workflow feature** — full audit trail (transitions + notes), workflow roles settings, timeline tab, ContractsList integration (2026-04-19)
- ✅ **Dashboard enhanced** — real revenue trend, 6 KPI cards, time-aware greeting, overdue quick-link, tEnum status badges, bilingual pie legend (2026-04-20)
- ✅ **ProjectListPage enhanced** — tEnum status/dropdown, end date column with overdue indicator, result count, budget overflow badge, summary footer (2026-04-20)
- ✅ **ProjectDetailPage fully i18n** — tabs translated, all labels bilingual via t()/tEnum(), tab key system type-safe (2026-04-20)
- ✅ **Offers Phase 0** — OffersProvider (single listener set), atomic offer numbering via offerCounter runTransaction, workflow_log and notes moved to subcollections, WorkflowLogEntry.is_system_generated typed, firestore.rules updated with nested subcollection rules, docs/09-offers-module.md created (2026-04-28)
