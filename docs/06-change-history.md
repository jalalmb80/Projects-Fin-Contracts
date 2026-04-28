# 06 — Change History

This document records every meaningful change made to the project, including the context behind architectural decisions. Commit SHAs are included for traceability.

---

## Commit history (oldest → newest)

---

### `c34925c` — Initial commit *(2026-04-07)*
GitHub’s automatic initial commit.

---

### `a6931d2` — Initialize project structure and dependencies *(2026-04-07)*
Modular platform shell, Finance + CMS modules, Vite + React + TypeScript + Tailwind.

---

### `a5520bf` — Integrate Firebase authentication and Firestore *(2026-04-07)*
Firebase Auth in PlatformContext; `useContracts` replaces in-memory CMS mock data.

---

### `0ec13f8` — Integrate platform context and improve UI feedback *(2026-04-07)*
Auth guard for `useContracts`; `ToastProvider` added; CMSDashboard sort fixed.

---

### `16cb78a` — feat(finance): Improve app context and routing *(2026-04-08)*
`ToastProvider` wraps `AppProvider`; 57 `console.log` → `addToast()`.

---

### `1ef5485` — Centralize data fetching with AppContext *(2026-04-08)*
`cms_projects` added to `useContracts`; Finance pages use `useApp()`; dead service files deleted.

---

### `0fcc5b4` — Add error handling to cms hooks and currency toggle *(2026-04-08)*
Error callbacks on all `onSnapshot` calls; currency + dark mode toggles wired.

---

### `3b95af8` — Add legal entity selection to subscription form *(2026-04-08)*
`SubscriptionForm` → `useApp().legalEntities`; id-spread fix; `cms_settings` rule added.

---

### `f758276` — fix: correct CMS data types, align Client form, replace alert() *(2026-04-08)*
CMS status enums, Client type alignment, `alert()` → inline feedback.

---

### `ce4faf0` — feat(cms/workflow): Phase 1+2 *(2026-04-19)*
CMS `WorkflowAssignee` + `WorkflowEvent`; `SettingsContext` loads roles; `useContracts.addWorkflowEvent` atomic.

---

### `d8dbb84` — feat(cms/workflow): Phase 3 *(2026-04-19)*
CMS `WorkflowTransitionModal` + `WorkflowNoteModal` portal components.

---

### `8c4df02` — feat(cms/workflow): Phase 4 *(2026-04-19)*
CMS `WorkflowTimeline` component.

---

### `5da761f` — feat(cms/workflow): Phase 5 *(2026-04-19)*
`ContractEditor` wired: status select → `WorkflowTransitionModal` → `addWorkflowEvent` → win side effects.

---

### `ce7c181` — feat(cms/workflow): Phase 6+7 *(2026-04-19)*
`ContractsList` status change via modal; `CMSSettingsPage` workflow roles section.

---

### `08ee6d1` — feat(finance): enhance dashboard, project list, project detail tabs with full i18n *(2026-04-20)*
Dashboard real revenue trend + 6 KPI cards; ProjectListPage + ProjectDetailPage fully bilingual.

---

### `db115c7` — feat(offers): Phase 0 — OffersProvider, atomic offer numbering, subcollection audit trail *(2026-04-28)*
`OffersProvider`; `generateOfferNumber()` `runTransaction`; `workflow_log` + `notes` subcollections; rules updated.

---

### `70dc56a` — feat(offers): Phase 1 — WorkflowAssignee, OfferTransitionModal, OfferNoteModal, OffersSettingsContext *(2026-04-28)*
`WorkflowLogEntry` gains `type` + `assignee`; `OfferTransitionModal` + `OfferNoteModal` portals; `addWorkflowLogEntry` batches system note; `offer_settings` Firestore rule.

---

### `c0e8f47` — feat(offers): Phase 2 — OfferPreviewPortal + exportOfferToPdf *(2026-04-28)*
Bilingual preview portal (two modes: preview/download); oklch-safe PDF export; Preview + PDF buttons in builder top bar.

---

### Phase 3 — feat(offers/cms): OfferVersion snapshots + OFFER_WON → CreateContractFromOfferModal *(2026-04-28)*

**Motivation:**
- Offers needed a content history so users can see what an offer looked like before each status transition.
- `OFFER_WON` was emitted but nothing listened; winning an offer should prompt creation of a CMS contract draft.

**3A — OfferVersion snapshots**

*Files created:*
- `src/modules/offers/hooks/useOfferVersions.ts` — subscribes to `offers/{id}/versions` (newest-first); used only in History tab.

*Files modified:*
- `src/modules/offers/types.ts` — added `OfferVersionSnapshot` (= `Omit<Offer, 'notes' | 'workflow_log'>`) and `OfferVersion { id, version_number, created_at, change_summary, snapshot }`.
- `src/modules/offers/services/offerService.ts` — added `subscribeVersions()`; extended `addWorkflowLogEntry` with optional 5th parameter `versionSnapshot?: OfferVersion` — written to `offers/{id}/versions/{versionId}` in the same `writeBatch` as the log entry, status update, and system note.
- `src/modules/offers/pages/OfferBuilderPage.tsx` — `handleTransitionConfirm` builds `OfferVersion` snapshot (pre-transition content state) and passes it to `addWorkflowLogEntry`; right panel gains a **History** tab (third tab alongside Workflow and Notes) backed by `useOfferVersions`; `VersionsPanel` inline component renders version cards.
- `firestore.rules` — `offers/{offerId}/versions/{versionId}` added: `read, create` only (immutable snapshots).
- `src/modules/offers/index.ts` — exports `useOfferVersions`, `OfferVersion`, `OfferVersionSnapshot`.

*Design decisions:*
- Versions are a **subcollection** (not embedded) because each snapshot contains `sections[]` + `line_items[]`. Embedding them would accelerate the 1 MB document-size limit reached with `workflow_log` + `notes`.
- `version_number = workflowLog.length + 1` at the time of transition: correct and no Firestore round-trip needed.
- The snapshot is taken **before** the transition (current `offer` state). This records what the offer looked like before the status changed.
- Manual snapshots (user-triggered) are Phase 4.

**3B — OFFER_WON → CreateContractFromOfferModal**

*Files created:*
- `src/modules/cms/components/CreateContractFromOfferModal.tsx` — Arabic-RTL modal pre-filled from OFFER_WON payload (offer number, client, total value). Generates a contract number placeholder (`CNT-{year}-OFF-{offerNumber}`), creates a minimal `Contract` draft with `status: 'مسودة'`, sets `linked_offer_id: offerId`. Writes directly via `setDoc(doc(db, 'cms_contracts', id), contract)` — no `useContracts()` dependency, matching `CreateFinanceProjectModal` pattern.

*Files modified:*
- `src/modules/cms/types.ts` — added `linked_offer_id?: string` to `Contract` interface.
- `src/modules/cms/components/CMSLayout.tsx` — added `CMSOfferWonHandler` function component: subscribes to `PLATFORM_EVENTS.OFFER_WON` via `platformBus.on()` in `useEffect` (cleanup is the returned unsubscribe function); stores payload in state; renders `CreateContractFromOfferModal` when payload is non-null. Mounted inside `CMSLayoutInner` so it has access to `LanguageProvider` + `SettingsProvider`.
- `src/core/events/platformBus.ts` — OFFER_WON payload comment updated to include `clientId: string` (was missing).
- `src/modules/offers/pages/OfferBuilderPage.tsx` — `handleTransitionConfirm` now emits `clientId: offer.client_id` in the OFFER_WON payload.

*Design decisions:*
- The modal appears only when CMS is mounted. This matches the existing `CONTRACT_SIGNED` → `CreateFinanceProjectModal` pattern (which also only appears inside `ContractEditor`). Documented as a known limitation.
- Payment schedule is pre-filled with a VAT-back-calculated breakdown from `offer.total_value` at 15% VAT. User should verify before finalising.
- `linked_offer_id` on the contract provides a permanent back-reference from contract to offer for audit and reporting.
