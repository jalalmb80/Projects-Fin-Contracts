# 08 — Known Issues & Remaining Work

This document captures everything that is known to be incomplete, imperfect, or deferred. Updated as of 2026-04-19.

---

## Open issues

### 1. `useContracts` creates multiple listener instances

**Severity:** Medium (cost / performance)  
**File:** `src/modules/cms/hooks/useContracts.ts`

The hook is called independently by each CMS page that mounts. If two CMS pages are rendered simultaneously, duplicate `onSnapshot` listeners open. This doubles read costs.

**Fix:** Lift `useContracts` into a `CMSProvider` context (similar to AppContext for Finance) and call it once at the `CMSLayout` level.

---

### 2. Dark mode is partially implemented

**Severity:** Low  
**File:** `src/modules/finance/components/Layout.tsx`

The toggle correctly sets the `dark` class on `document.documentElement`. However, `dark:` variant styles are not defined across Finance components — the toggle works mechanically but has no visual effect.

The CMS module is unaffected.

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

"Record Payment" creates a payment and updates balance directly, bypassing `allocatePayment()`. Payments recorded this way won't appear in `payment.allocations[]`.

---

### 7. Workflow tab "تغيير الحالة" button navigates to Metadata tab

**Severity:** Low (UX)  
**File:** `src/modules/cms/components/ContractEditor.tsx`

The "تغيير الحالة" button in the WorkflowTimeline tab navigates the user to the Metadata tab where the status select is located. A future improvement would be to open the `WorkflowTransitionModal` directly from the workflow tab with a status-picker step, without requiring the tab switch. This was a deliberate trade-off to avoid duplicating the status-select UI.

---

## Architectural debt

### A. CMS module lacks a shared context

Each CMS page opens its own Firestore listeners. A `CMSProvider` wrapping CMS routes would open listeners once and share data — matching the Finance module's pattern.

### B. CMS and Finance use separate project registries

A Finance project and a CMS project represent similar real-world entities but use different schemas and collections. The `platformBus` integration (contract signed → billing form pre-filled) is a workaround.

### C. No role-based access control

All authenticated users have full read/write access. Extension requires a `role` field per user in Firestore or Firebase custom claims.

### D. No automated tests

The project has no unit, integration, or E2E tests. `npm run lint` runs `tsc --noEmit` for type checking only.

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
- ✅ `CMSClientsPage` form fields didn't match `Client` type
- ✅ `alert()` calls replaced with toast / inline feedback
- ✅ Currency toggle wired to `setDisplayCurrency()`
- ✅ Dark mode toggle wired to `document.documentElement.classList`
- ✅ Dead service files, ProtectedRoute, temp files deleted
- ✅ **Contract workflow feature** — full audit trail (transitions + notes), workflow roles settings, timeline tab, ContractsList integration (2026-04-19)
