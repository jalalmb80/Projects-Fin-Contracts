# 06 — Change History

This document records every meaningful change made to the project, including the context behind architectural decisions. Commit SHAs are included for traceability.

---

## Commit history (oldest → newest)

---

### `c34925c` — Initial commit *(2026-04-07)*

GitHub's automatic initial commit. Created the repository.

---

### `a6931d2` — Initialize project structure and dependencies *(2026-04-07)*

Established the modular platform shell:
- Created `AppShell`, `ModuleSwitcher`, `PlatformContext`, `platformBus`
- Registered Finance and CMS modules in `registry.tsx`
- Set up Vite + React + TypeScript + Tailwind configuration
- Both modules were lazy-loaded via `React.lazy()`

**Context:** This was the first integration step merging the two source projects (FinArchiTec2.1 and contracts-main) into one app. The module registry pattern was chosen so new modules can be added by registering a single entry — no changes to AppShell required.

---

### `a5520bf` — Integrate Firebase authentication and Firestore *(2026-04-07)*

- Wired Firebase Auth into `PlatformContext`
- Created `useContracts` hook to replace the CMS module's in-memory mock data with real Firestore listeners
- Updated CMS pages to use the hook
- Added `.env.example`

---

### `0ec13f8` — Integrate platform context and improve UI feedback *(2026-04-07)*

- Added auth guard to `useContracts`
- Added `ToastProvider` to Finance routes
- Fixed `CMSDashboardPage` sort

---

### `16cb78a` — feat(finance): Improve app context and routing *(2026-04-08)*

- Fixed provider order: `ToastProvider` wraps `AppProvider`
- Replaced all 57 `console.log` calls in AppContext with `addToast()`
- Fixed `CMSDashboardPage` to use `useContracts().clients`
- Deleted `temp_billing.tsx`

---

### `1ef5485` — Centralize data fetching with AppContext *(2026-04-08)*

- Added `cms_projects` collection to `useContracts` hook
- Added Firestore rules for `cms_projects`
- Refactored Finance pages to use `useApp()` instead of service files
- Deleted all 5 unused service files

---

### `0fcc5b4` — Add error handling to cms hooks and currency toggle *(2026-04-08)*

- Added error callbacks to all `onSnapshot` calls
- Wired currency toggle and dark mode toggle

---

### `3b95af8` — Add legal entity selection to subscription form *(2026-04-08)*

- `SubscriptionForm` populates Legal Entity dropdown from `useApp().legalEntities`
- Fixed AppContext `getDocs` id-spread bug
- Added Firestore rule for `cms_settings`

---

### `f758276` — fix: correct CMS data types, align Client form, replace alert() *(2026-04-08)*

- `CMSProjectsPage` status values corrected to Arabic `ProjectStatus` type
- `CMSClientsPage` form fields aligned to `Client` type
- `CMSSettingsPage` and `BillingDetailPage` replaced `alert()` with inline feedback

---

### `ce4faf0` — feat(cms/workflow): Phase 1+2 — types, settings context, useContracts hook *(2026-04-19)*

- Added `WorkflowAssignee` and `WorkflowEvent` interfaces to CMS `types.ts`
- `SettingsContext` loads `workflow_roles` from Firestore `cms_settings/config`
- `useContracts` gains `addWorkflowEvent()` — atomic `updateDoc` prepending event + updating status

---

### `d8dbb84` — feat(cms/workflow): Phase 3 — WorkflowTransitionModal + WorkflowNoteModal *(2026-04-19)*

- CMS `WorkflowTransitionModal`: portal modal collecting assignee role+name+optional note
- CMS `WorkflowNoteModal`: portal modal for note-only events (status unchanged)

---

### `8c4df02` — feat(cms/workflow): Phase 4 — WorkflowTimeline component *(2026-04-19)*

- Current-status banner + action buttons + EventCard timeline (newest-first)

---

### `5da761f` — feat(cms/workflow): Phase 5 — wire ContractEditor *(2026-04-19)*

- Added `سجل الإجراءات` tab; status select goes through WorkflowTransitionModal
- `handleTransitionConfirm` → `addWorkflowEvent()` → win-status side effects + platformBus

---

### `ce7c181` — feat(cms/workflow): Phase 6+7 — ContractsList + CMSSettingsPage *(2026-04-19)*

- ContractsList: status change via `WorkflowTransitionModal`
- CMSSettingsPage: workflow roles section with inline edit/delete

---

### `08ee6d1` — feat(finance): enhance dashboard, project list, and project detail tabs with full i18n *(2026-04-20)*

- Dashboard: real revenue trend, 6 KPI cards, time-aware greeting, overdue quick-link
- ProjectListPage: end-date column, result count, budget overflow, `tEnum()` labels
- ProjectDetailPage: all tabs and labels fully bilingual via `t()` / `tEnum()`

---

### `db115c7` — feat(offers): Phase 0 — OffersProvider, atomic offer numbering, subcollection audit trail *(2026-04-28)*

**Files created:**
- `src/modules/offers/context/OffersContext.tsx` — OffersProvider + useOffersContext()
- `src/modules/offers/hooks/useOfferDetail.ts` — per-offer subcollection subscriptions
- `docs/09-offers-module.md` — full module documentation

**Key changes:**
- `useOffers()` runs once at OffersProvider level; pages call `useOffersContext()`
- `generateOfferNumber()` rewritten as async `runTransaction` on `appSettings/offerCounter`
- `workflow_log` moved to `offers/{id}/workflow_log` subcollection (immutable, create-only)
- `notes` moved to `offers/{id}/notes` subcollection
- `addWorkflowLogEntry` uses `writeBatch` (status + log entry atomic)
- `WorkflowLogEntry.is_system_generated?: boolean` added (fixes silent `as any` cast)
- `Offer.notes` and `Offer.workflow_log` marked `@deprecated`
- `firestore.rules`: subcollection rules nested in `/offers/{offerId}`

---

### Phase 1 — feat(offers): WorkflowAssignee, OfferTransitionModal, OfferNoteModal, OffersSettingsContext *(2026-04-28)*

**Motivation:** Phase 0 moved the data to subcollections but the workflow UX remained an inline panel form. Phase 1 brings the offers workflow to parity with the CMS contracts workflow.

**Files created:**
- `src/modules/offers/context/OffersSettingsContext.tsx` — `OffersSettingsProvider` + `useOffersSettings()`; loads `offer_settings/general` via `getDoc`; exposes `offerWorkflowRoles[]` + `updateOfferWorkflowRoles()`
- `src/modules/offers/components/OfferTransitionModal.tsx` — portal modal; collects responsible person (role from settings, name required) + optional reason; produces `WorkflowLogEntry { type: 'transition' }`; pure UI, mirrors CMS `WorkflowTransitionModal`
- `src/modules/offers/components/OfferNoteModal.tsx` — portal modal; note body required; produces `WorkflowLogEntry { type: 'note', from_status === to_status }`; mirrors CMS `WorkflowNoteModal`

**Files modified:**
- `src/modules/offers/types.ts` — Added `WorkflowAssignee { role, name }` interface; `WorkflowLogEntry` gains `type: 'transition' | 'note'` and `assignee: WorkflowAssignee`; added `DEFAULT_OFFER_WORKFLOW_ROLES` constant
- `src/modules/offers/services/offerService.ts` — `addWorkflowLogEntry` gains optional `systemNote?: OfferNote` parameter; all three writes (log entry + status update + system note) now in one `writeBatch` (fixes issue #9)
- `src/modules/offers/components/OffersLayout.tsx` — wraps with `OffersSettingsProvider` inside `OffersProvider`
- `src/modules/offers/components/WorkflowPanel.tsx` — inline form replaced by "Change Status" transition buttons + "Add Note" button; props changed to `onTransitionRequest(toStatus)` + `onNoteRequest()`; timeline displays `assignee.role / assignee.name` and colors `type === 'note'` entries in blue
- `src/modules/offers/pages/OfferBuilderPage.tsx` — modal state: `pendingTransitionTo: OfferStatus | null` + `showNoteModal: boolean`; `handleTransitionConfirm(entry)` builds system note and calls atomic `addWorkflowLogEntry(offerId, entry, toStatus, systemNote)`; `handleNoteConfirm(entry)` calls `addWorkflowLogEntry(offerId, entry)` only; Workflow tab badge now shows `workflowLog.length`
- `firestore.rules` — `offer_settings/{document=**}` collection added (authenticated read/write)
- `src/modules/offers/index.ts` — exports `WorkflowAssignee`, `DEFAULT_OFFER_WORKFLOW_ROLES`, `OffersSettingsProvider`, `useOffersSettings`, `REASON_REQUIRED`

**Design decisions:**
- `OffersSettingsProvider` wraps inside `OffersProvider` in `OffersLayout` — both in scope for all offer pages and modals
- Role list defaults to English (`DEFAULT_OFFER_WORKFLOW_ROLES`) since Offers is an EN-first module; stored in `offer_settings/general.workflow_roles` and user-editable (UI for editing to be added in a future settings page)
- `WorkflowLogEntry.type === 'note'` entries appear in the WorkflowPanel timeline (audit trail) rather than the NotesPanel (user sticky notes) — same separation as CMS: workflow audit vs. conversation notes
- Pre-Phase-1 `WorkflowLogEntry` records (missing `type` and `assignee`) are handled defensively in WorkflowPanel via optional chaining on `entry.assignee?.name`
