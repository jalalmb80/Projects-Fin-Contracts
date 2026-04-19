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
- Metadata tab status select now calls `handleStatusChangeRequest()` instead of directly mutating state; the select has an amber border to signal it is workflow-tracked
- `handleStatusChangeRequest` → sets `pendingStatus` → opens `WorkflowTransitionModal`
- `handleTransitionConfirm` → calls `addWorkflowEvent()` → updates local state → fires win-status side effects (Finance modal + platformBus)
- `handleNoteConfirm` → calls `addWorkflowEvent()` without status change
- Version diff comparison excludes `workflow_events` from the change check
- New contracts initialize with `workflow_events: []`

---

### `ce7c181` — feat(cms/workflow): Phase 6+7 — ContractsList + CMSSettingsPage *(2026-04-19)*

**Files modified:** `components/ContractsList.tsx`, `pages/CMSSettingsPage.tsx`

**ContractsList (Phase 6):**
- Kebab menu "تغيير الحالة" no longer calls `updateContract` directly
- Flow: kebab click → inline status picker popover → user picks new status → `WorkflowTransitionModal` → `addWorkflowEvent()`
- Old `StatusPopover` component removed; replaced by simpler inline picker that appears next to the row's actions cell
- `getStatusColor()` now derives colors from `contractStatuses` config instead of hardcoded Arabic strings

**CMSSettingsPage (Phase 7):**
- Added "أدوار سير العمل" section (same pattern as contract_statuses and contract_types)
- Roles list with inline edit/delete per row; "إضافة دور" input; persists via `updateWorkflowRoles()`
- `SectionHeader` component updated to accept `'roles'` as a `which` value
- `GitBranch` icon in section header for visual distinction

---

## Source project lineage

This project was built by merging two standalone apps:

| Source repo | Became | Key characteristics |
|---|---|---|
| `jalalmb80/FinArchiTec2_1-main` | `src/modules/finance/` | Firebase, full routing, AppContext reducer |
| `jalalmb80/contracts-main` | `src/modules/cms/` | In-memory mock data, Arabic-only, no Firebase |

The merge introduced: shared AppShell, PlatformContext, platformBus, lazy module loading, and Firebase connectivity for the CMS module.
