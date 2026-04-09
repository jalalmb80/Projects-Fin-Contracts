# 08 — Known Issues & Remaining Work

This document captures everything that is known to be incomplete, imperfect, or deferred. Updated as of the last commit on 2026-04-08.

---

## Open issues

### 1. `useContracts` creates multiple listener instances

**Severity:** Medium (cost / performance)  
**File:** `src/modules/cms/hooks/useContracts.ts`

The hook is called independently by each CMS page that mounts. If two CMS pages are rendered simultaneously (e.g. within the same route tree), duplicate `onSnapshot` listeners open against the same Firestore collections. This doubles read costs.

**Fix:** Lift `useContracts` into a `CMSProvider` context (similar to how `AppContext` works for Finance) and call it once at the `CMSLayout` level. Pages would then use `useCMS()` instead of `useContracts()`.

---

### 2. `alert()` still present in two CMS components

**Severity:** Low (UX)  
**Files:** `src/modules/cms/components/ContractEditor.tsx` (lines 290, 1468)

Two `alert()` calls remain in `ContractEditor`: one on template save success, one on PDF export failure. These should be converted to the inline feedback state pattern used in the pages.

---

### 3. Dark mode is partially implemented

**Severity:** Low  
**File:** `src/modules/finance/components/Layout.tsx`

The toggle correctly sets the `dark` class on `document.documentElement`. However, the Tailwind config does not currently define `dark:` variant styles for the Finance module's components. The toggle works mechanically but has no visual effect until `dark:` CSS classes are added throughout the Finance components.

The CMS module is unaffected — it doesn't have a dark mode toggle.

---

### 4. Google Drive integration is incomplete

**Severity:** Low  
**File:** `src/modules/cms/services/googleDrive.ts`

The Google Drive service is initialized and the OAuth token flow is implemented. However, the upload button in the contract attachment UI is not connected to the service — no attachment is actually saved to Drive or stored in Firestore.

---

### 5. BillingDetailPage Edit button is non-functional

**Severity:** Medium  
**File:** `src/modules/finance/pages/BillingDetailPage.tsx`

The Edit button on draft invoices renders an icon but has no `onClick` handler and no route. Editing a billing document requires navigating to `BillingFormPage` with the document id pre-loaded, but this navigation is not wired.

---

### 6. Subscription `billingInterval` field unused

**Severity:** Low  
**File:** `src/modules/finance/types.ts`

`Subscription.billingInterval` (optional number) exists in the type but is not used by `runBillingJob` — which only checks `billingCycle`. The intention was to support custom intervals (e.g. every 2 months) via `BillingCycle.Custom` + `billingInterval`, but this is not implemented.

---

### 7. Payment allocation flow is simplified

**Severity:** Medium (correctness)  
**File:** `src/modules/finance/pages/BillingDetailPage.tsx`

The "Record Payment" form on the invoice detail page creates a payment and updates the invoice balance directly in one step, without going through the `allocatePayment()` function in AppContext. This bypasses the proper allocation object creation. Payments recorded this way won't appear in `payment.allocations[]` and won't be queryable by invoice.

**Fix:** Refactor `handlePaymentSubmit` to use `recordPayment()` followed by `allocatePayment()` from AppContext.

---

## Architectural debt

### A. CMS module lacks a shared context

Each CMS page opens its own set of 4 Firestore listeners when mounted. A `CMSProvider` wrapping the CMS routes would open listeners once and share the data via context — matching the Finance module's pattern.

### B. CMS and Finance use separate client/project registries

A Finance counterparty and a CMS client represent the same real-world entity but are stored in different Firestore collections with different schemas. Long-term, a unified entity registry would reduce duplication and allow contracts and invoices to reference the same record. The `platformBus` integration (contract signed → billing form auto-filled) is a workaround for this gap.

### C. No role-based access control

All authenticated users have full read/write access to all data. If the app needs to support viewer-only roles or restrict Finance data from CMS users, the Firestore rules and PlatformContext need to be extended with a `role` field per user (stored in Firestore or Firebase custom claims).

### D. No automated tests

The project has no unit, integration, or E2E tests. The `npm run lint` script runs `tsc --noEmit` for type checking only.

---

## Completed items (for reference)

All items below were identified as bugs and have been fixed:

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
- ✅ AppContext `getDocs` missing `id: d.id` spread (products, legalEntities, budgetCategories)
- ✅ `SubscriptionForm` hardcoded `legalEntityId: 'default'`
- ✅ `CMSProjectsPage` used English status values; `ProjectStatus` type requires Arabic
- ✅ `CMSClientsPage` form fields didn't match `Client` type
- ✅ `alert()` calls replaced with toast / inline feedback in Finance and CMS pages
- ✅ Currency toggle wired to `setDisplayCurrency()`
- ✅ Dark mode toggle wired to `document.documentElement.classList`
- ✅ Dead service files, ProtectedRoute, temp files deleted (7 files removed)
