# 06 — Change History

This document records every meaningful change made to the project, including the context behind architectural decisions. Commit SHAs are included for traceability.

---

## Commit history (oldest → newest)

---

### `c34925c` — Initial commit *(2026-04-07)*

GitHub’s automatic initial commit. Created the repository.

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
- Created `useContracts` hook to replace the CMS module’s in-memory mock data with real Firestore listeners
- Updated CMS pages (`CMSClientsPage`, `CMSProjectsPage`, `ContractsPage`) to use the hook
- Added `.env.example` with all required Firebase and Google Cloud variables

---

### `0ec13f8` — Integrate platform context and improve UI feedback *(2026-04-07)*

- Added auth guard to `useContracts`
- Removed dead `notification` state from `AppContext`
- Added `ToastProvider` to Finance routes
- Fixed `CMSDashboardPage` sort

---

### `16cb78a` — feat(finance): Improve app context and routing *(2026-04-08)*

- Fixed provider order: moved `ToastProvider` to wrap `AppProvider`
- Replaced all 57 `console.log` calls in AppContext with real `addToast()` calls
- Fixed `CMSDashboardPage` to use `useContracts().clients`
- Deleted `temp_billing.tsx`

---

### `1ef5485` — Centralize data fetching with AppContext *(2026-04-08)*

- Added `cms_projects` collection to `useContracts` hook
- Added Firestore rules for `cms_projects`
- Fixed `useContracts` snapshot mapping
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

**Files changed:** `types.ts`, `context/SettingsContext.tsx`, `hooks/useContracts.ts`

- Added `WorkflowAssignee` and `WorkflowEvent` interfaces to `types.ts`
- Added `workflow_events?: WorkflowEvent[]` to `Contract`
- Added `workflow_roles: string[]` to `AppSettings` with `DEFAULT_WORKFLOW_ROLES`
- `SettingsContext` loads `workflow_roles` from Firestore `cms_settings/config`; exposes `workflowRoles` and `updateWorkflowRoles()`
- `useContracts` gains `addWorkflowEvent(contractId, event, newStatus?)` — single atomic `updateDoc` that prepends the event and optionally updates status

**Design decision:** `workflow_events` is embedded as an array inside `cms_contracts` documents (not a subcollection) — consistent with the existing `versions[]` pattern, safe for single-tenant usage.

---

### `d8dbb84` — feat(cms/workflow): Phase 3 — WorkflowTransitionModal + WorkflowNoteModal *(2026-04-19)*

**Files created:** `components/WorkflowTransitionModal.tsx`, `components/WorkflowNoteModal.tsx`

- `WorkflowTransitionModal`: dialog for status-change events. Collects role (from configurable list, or free text when 'أخرى' selected) + assignee name (required) + optional note. Renders via `createPortal`. Pure UI — caller handles persistence.
- `WorkflowNoteModal`: simplified dialog for note-only events. Same assignee fields; note is required. Produces `type: 'note'` event with `from_status === to_status`.

---

### `8c4df02` — feat(cms/workflow): Phase 4 — WorkflowTimeline component *(2026-04-19)*

**File created:** `components/WorkflowTimeline.tsx`

- Current-status banner showing latest assignee
- "إضافة ملاحظة" and "تغيير الحالة" action buttons
- `EventCard` list (newest-first): expandable cards; transitions in amber/emerald, notes in blue
- Empty state with explanatory message

---

### `5da761f` — feat(cms/workflow): Phase 5 — wire ContractEditor *(2026-04-19)*

**File modified:** `components/ContractEditor.tsx`

- Added `GitBranch`-icon **سجل الإجراءات** tab with event-count badge
- Metadata tab status select now calls `handleStatusChangeRequest()` instead of directly mutating state
- `handleStatusChangeRequest` → sets `pendingStatus` → opens `WorkflowTransitionModal`
- `handleTransitionConfirm` → calls `addWorkflowEvent()` → updates local state → fires win-status side effects
- Version diff comparison excludes `workflow_events` from the change check

---

### `ce7c181` — feat(cms/workflow): Phase 6+7 — ContractsList + CMSSettingsPage *(2026-04-19)*

**Files modified:** `components/ContractsList.tsx`, `pages/CMSSettingsPage.tsx`

- ContractsList: kebab menu “تغيير الحالة” now goes through `WorkflowTransitionModal`
- CMSSettingsPage: added workflow roles section with inline edit/delete and persistence via `updateWorkflowRoles()`

---

### `08ee6d1` — feat(finance): enhance dashboard, project list, and project detail tabs with full i18n *(2026-04-20)*

**Files changed:** `DashboardPage.tsx`, `ProjectListPage.tsx`, `ProjectDetailPage.tsx`

- Dashboard: real revenue trend, 6 KPI cards, time-aware greeting, overdue quick-link, `tEnum()` status badges
- ProjectListPage: end-date column with overdue indicator, result count bar, budget overflow badge, `tEnum()` labels
- ProjectDetailPage: all tabs and labels fully bilingual via `t()` / `tEnum()`

---

### Phase 0 — feat(offers): OffersProvider, atomic offer numbering, subcollection audit trail *(2026-04-28)*

**Motivation:** Pre-Phase-0 offers had three architectural problems: (1) `useOffers()` called independently from every page opened duplicate Firestore listeners; (2) offer numbers used `Math.random()` with birthday-collision risk; (3) `workflow_log` and `notes` embedded as arrays risked hitting Firestore’s 1 MB document limit on large offers.

**Files created:**
- `src/modules/offers/context/OffersContext.tsx` — `OffersProvider` + `useOffersContext()`
- `src/modules/offers/hooks/useOfferDetail.ts` — per-offer subcollection subscriptions
- `docs/09-offers-module.md` — full module documentation

**Files modified:**
- `src/modules/offers/types.ts` — `WorkflowLogEntry.is_system_generated?: boolean` added (fixes silent `as any` cast); `Offer.notes` and `Offer.workflow_log` marked `@deprecated` and made optional
- `src/modules/offers/utils/offerNumber.ts` — rewritten as `async`; uses `runTransaction` on `appSettings/offerCounter` (same pattern as Finance invoice counter)
- `src/modules/offers/services/offerService.ts` — `createOffer` now accepts `(offer, initialWorkflowEntry)` and uses `writeBatch`; `addWorkflowLogEntry` uses `writeBatch` (status + subcollection entry atomic); `addNote` writes to subcollection; `subscribeWorkflowLog` and `subscribeNotes` added
- `src/modules/offers/hooks/useOffers.ts` — updated comment; exposes new `createOffer` signature transparently
- `src/modules/offers/components/OffersLayout.tsx` — wraps with `OffersProvider`; moved user-email footer out to keep layout clean
- `src/modules/offers/components/WorkflowPanel.tsx` — `workflowLog: WorkflowLogEntry[]` added as explicit prop; removes dependency on deprecated `offer.workflow_log`
- `src/modules/offers/pages/OffersDashboardPage.tsx` — `useOffersContext()` replaces `useOffers()`
- `src/modules/offers/pages/OffersListPage.tsx` — `useOffersContext()`, `await generateOfferNumber()`, new `createOffer(offer, initialEntry)` call pattern, `STATUS_LABELS` used for filter chip labels
- `src/modules/offers/pages/TemplatesPage.tsx` — `useOffersContext()`
- `src/modules/offers/pages/OfferBuilderPage.tsx` — `useOffersContext()` + `useOfferDetail(id)`; `WorkflowPanel` receives `workflowLog` prop; `NotesPanel` receives `notes` from subcollection; notes badge uses `notes.length`; removed unused `Edit3` import
- `src/modules/offers/index.ts` — exports `useOffersContext`, `OffersProvider`, `useOfferDetail`
- `firestore.rules` — subcollection rules nested inside `/offers/{offerId}`: `workflow_log` create-only (immutable audit trail), `notes` create+update (pin toggle)

**Design decisions:**
- `workflow_log` uses `orderBy('created_at', 'desc')` at the query level; no client-side sort needed
- `notes` subcollection also newest-first so `notes.length` for the tab badge is correct from first snapshot
- Pre-Phase-0 documents with embedded `notes`/`workflow_log` arrays are ignored silently (optional fields); no migration script needed for single-tenant usage
- `addNote` (system note on transition) remains a separate write; Phase 1 will batch it with `addWorkflowLogEntry` for full atomicity
