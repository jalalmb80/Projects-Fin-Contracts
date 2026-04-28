# 08 — Known Issues & Remaining Work

Updated as of 2026-04-28 (Phase 3).

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
Should open `WorkflowTransitionModal` directly from the workflow tab.

---

### 8. KPI trend values on Finance Dashboard are static
**Severity:** Low (UX)  
`trend` prop on KpiCard is hardcoded. Should compare current vs previous month.

---

### 10. Offers: `expired` status has no inbound transition
**Severity:** Low (arch debt)  
Intended for a scheduled Cloud Function checking `expiry_date < today`.

---

### 12. GEMINI_API_KEY exposed in client bundle
**Severity:** Crash-class security issue  
`vite.config.ts` `define: { 'process.env.GEMINI_API_KEY': ... }` injects the key into the production bundle.  
**Fix:** Remove the `define` block. Rename to `VITE_GEMINI_API_KEY` if client-side use is needed, OR move calls to a server function.

---

### 13. Firestore rules: no field-level restrictions
**Severity:** Medium (security)  
All collections allow full read/write to any authenticated user. `appSettings/invoiceCounter` and `appSettings/offerCounter` can be overwritten by any user.  
**Fix:** Add `request.resource.data.keys().hasOnly(['lastSequence'])` for counters. Full RBAC requires Firebase Custom Claims.

---

### 14. OFFER_WON modal only appears when CMS is mounted
**Severity:** Low (UX)  
`CMSOfferWonHandler` subscribes to `OFFER_WON` inside `CMSLayout`. If the user is on the Finance or Offers module when they mark an offer as Won, the Create Contract modal will not appear. They must navigate to CMS manually.  
**Fix (future):** Move a platform-level bus handler to `AppShell` and show a persistent notification/badge that survives module navigation.

---

## Architectural debt

### A. CMS module lacks a shared context
Each CMS page opens its own Firestore listeners. A `CMSProvider` wrapping `CMSLayout` would deduplicate subscriptions — matching Finance and Offers patterns.

### B. No role-based access control
All authenticated users have full read/write. Requires Firebase Custom Claims.

### C. No automated tests
`npm run lint` runs `tsc --noEmit` only.

### D. Offers status labels not settings-driven
Hardcoded in `types.ts`. Phase 4+ will add `offer_settings/general.offer_statuses[]`.

### E. PDF export engine duplicated across CMS and Offers
`cms/utils/exportPdf.ts` and `offers/utils/exportPdf.ts` are identical. Phase 4 will extract to `src/core/utils/exportPdf.ts`.

### F. Offer version snapshots: no restore UI
Phase 3 adds version history display. Restoring a snapshot (copying it back to the live offer) is Phase 4.

---

## Completed items (for reference)

- ✅ `ToastProvider` missing → crash on Finance pages
- ✅ All `console.log` calls in AppContext → `addToast()`
- ✅ `useContracts` opened listeners before auth confirmed
- ✅ Invoice number race condition (`runTransaction`)
- ✅ All `alert()` calls replaced
- ✅ **CMS workflow feature** — audit trail, roles config, timeline, ContractsList integration (2026-04-19)
- ✅ **Finance i18n** — Dashboard, ProjectListPage, ProjectDetailPage fully bilingual (2026-04-20)
- ┅ **Offers Phase 0** — OffersProvider, atomic numbering, subcollections (2026-04-28)
- ✅ **Offers Phase 1** — WorkflowAssignee, OfferTransitionModal, OfferNoteModal, system note batched (2026-04-28)
- ✅ **Offers Phase 2** — OfferPreviewPortal + exportOfferToPdf (2026-04-28)
- ✅ **Offers Phase 3A** — OfferVersion subcollection; version snapshot in transition writeBatch; History tab in right panel (2026-04-28)
- ✅ **Offers Phase 3B** — OFFER_WON subscriber in CMSLayout; CreateContractFromOfferModal; `linked_offer_id` on Contract; `clientId` in OFFER_WON payload (2026-04-28)
