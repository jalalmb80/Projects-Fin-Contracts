# 08 — Known Issues & Remaining Work

Updated as of 2026-04-28 (security fixes applied).

---

## Open issues

### 1. `useContracts` creates multiple listener instances
**Severity:** Medium (Firestore cost)  
Fix: lift into `CMSProvider` wrapping `CMSLayout`, matching the Finance and Offers patterns.

---

### 2. Dark mode is partially implemented
**Severity:** Low  
Toggle sets `dark` class on `document.documentElement` but Finance components have no `dark:` variants.

---

### 3. Google Drive integration is incomplete
**Severity:** Low  
OAuth flow + contract preview upload work; Attachments tab files not synced.

---

### 4. BillingDetailPage Edit button is non-functional
**Severity:** Medium  
Edit button on draft invoices has no `onClick` handler and no route.

---

### 5. Subscription `billingInterval` field unused
**Severity:** Low  
`Subscription.billingInterval` not consumed by `runBillingJob`.

---

### 6. Payment allocation flow is simplified
**Severity:** Medium  
"Record Payment" bypasses `allocatePayment()`; payments won't appear in `allocations[]`.

---

### 7. CMS workflow tab "تغيير الحالة" navigates to Metadata tab
**Severity:** Low (UX)

---

### 8. KPI trend values on Finance Dashboard are static
**Severity:** Low (UX)  
`trend` prop on KpiCard is hardcoded.

---

### 10. Offers: `expired` status has no inbound transition
**Severity:** Low (arch debt)  
Intended for a scheduled Cloud Function checking `expiry_date < today`.

---

### 14. OFFER_WON modal only appears when CMS is mounted
**Severity:** Low (UX)  
`CMSOfferWonHandler` is inside `CMSLayout`. If the user is on Finance or Offers when marking Won, the Create Contract modal will not appear.  
**Fix (future):** Move handler to `AppShell` with a platform-level notification badge.

---

### 15. Offer version snapshots: no restore UI
**Severity:** Low (arch debt)  
History tab shows versions; copying a snapshot back to the live offer is not yet implemented.

---

## Architectural debt

### A. CMS module lacks a shared context
Each CMS page opens its own Firestore listeners. A `CMSProvider` wrapping `CMSLayout` would deduplicate subscriptions — matching Finance and Offers patterns.

### B. No role-based access control
All authenticated users have full read/write. `isValidCounterWrite()` now protects counters but collection-level RBAC requires Firebase Custom Claims.

### C. No automated tests
`npm run lint` runs `tsc --noEmit` only.

### D. Offers status labels not settings-driven
Hardcoded in `types.ts`. Future: `offer_settings/general.offer_statuses[]`.

---

## Completed items (for reference)

- ✅ `ToastProvider` missing → crash on Finance pages
- ✅ All `console.log` in AppContext → `addToast()`
- ✅ `useContracts` opened listeners before auth confirmed
- ✅ Invoice number race condition (`runTransaction`)
- ✅ All `alert()` calls replaced
- ✅ **CMS workflow feature** — full audit trail, roles config, timeline (2026-04-19)
- ✅ **Finance i18n** — Dashboard, ProjectListPage, ProjectDetailPage (2026-04-20)
- ✅ **Offers Phase 0** — OffersProvider, atomic numbering, subcollections (2026-04-28)
- ✅ **Offers Phase 1** — WorkflowAssignee, modals, system note batched (2026-04-28)
- ✅ **Offers Phase 2** — OfferPreviewPortal + PDF export (2026-04-28)
- ✅ **Offers Phase 3A** — OfferVersion subcollection + History tab (2026-04-28)
- ✅ **Offers Phase 3B** — OFFER_WON subscriber + CreateContractFromOfferModal (2026-04-28)
- ✅ **Offers Phase 4A** — OfferTemplateEditor with per-section content editing (2026-04-28)
- ┅ **Offers Phase 4B** — Bilingual labels: WorkflowBadge lang prop, OfferCard, WorkflowPanel; isExpired date-fns fix (2026-04-28)
- ✅ **Offers Phase 4C** — Shared PDF engine in `src/core/utils/exportPdf.ts` (2026-04-28)
- ✅ **Security A1** — Removed `define: { GEMINI_API_KEY }` from vite.config.ts (was injecting key into client bundle via `loadEnv` with no prefix filter, with zero consumers). `.env.example` updated with safe usage notes (2026-04-28)
- ✅ **Security A2/A3** — Firestore rules: `appSettings/invoiceCounter` and `appSettings/offerCounter` now use `isValidCounterWrite()` — write restricted to `{ lastSequence: <positive int> }` only. Wildcard `appSettings/{docId}` rule excludes counter doc IDs via guard, preventing the more-permissive wildcard from overriding the field-restricted rules (2026-04-28)
