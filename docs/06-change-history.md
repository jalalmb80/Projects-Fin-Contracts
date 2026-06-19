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

### `08ee6d1` — feat(finance): enhance dashboard, project list, and project detail tabs with full i18n *(2026-04-20)*

**Files changed:** `DashboardPage.tsx`, `ProjectListPage.tsx`, `ProjectDetailPage.tsx`

**DashboardPage:**
- Expanded KPI grid from 4 cards to 6 (added Active Projects + Active Subscriptions)
- Revenue Trend chart now computed from real AR invoice data (last 6 months grouped by `invoice.date`) — previously used 100% mocked static data
- Greeting is now time-aware: صباح الخير / مساء الخير / مساء النور (Good morning / afternoon / evening)
- Added overdue quick-link badge in header when overdueCount > 0
- Status badges now use `tEnum()` — no more raw enum strings in Arabic mode
- Invoice type column uses `tEnum()` on `invoice.type`
- Recent invoices sorted by `updatedAt desc` (was slice order)
- "View all" link to /finance/billing added
- Pie chart legend bilingual via `t()`, with empty-state fallback when both values are 0
- Removed unused `useState`, `ArrowUpRight`, `ArrowDownRight` imports

**ProjectListPage:**
- Status dropdown options now use `tEnum()` — Arabic labels in AR mode, English in EN mode
- Status badges use `tEnum()`
- Contract type column uses `tEnum()`
- "Started" label uses `t()` (was hardcoded English)
- Added End Date column with `AlertCircle` icon and rose color when project is overdue (endDate < today and status is not Completed/Cancelled)
- Added result count bar when filter is active: "Showing X of Y"
- Added `<tfoot>` summary showing count + active count
- Budget Health bar: overflow indicator (AlertCircle icon) when budgetPct > 100
- Improved visual styling: `slate` palette, `rounded-xl`, primary-600 button
- Added `isPast`, `parseISO` from date-fns

**ProjectDetailPage:**
- Imported `useLang, t, tEnum` from LanguageContext; added `const { lang } = useLang()`
- Tabs refactored: replaced `['Overview','Milestones','Budget','Documents'].map(tab => tab.toLowerCase())` with typed `TABS` constant `{ key, ar, en }[]` — tab keys are type-safe, labels bilingual via `t(ar, en, lang)`
- All UI labels translated throughout: header fields (Client, Contract, Contract Value), all 4 tab contents (section headers, column headers, empty states), all modal titles and form field labels, all ConfirmDialog titles and messages
- Status badges use `tEnum()` for project status, milestone status, and document status
- Milestone status dropdown uses `tEnum()` in select options
- "Project not found" state translated with icon
- `Briefcase` icon added (was unused import, now used in not-found state)
- Removed unused `Calendar`, `Clock`, `AlertCircle` from imports — replaced by specific used icons

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

### `ab182ba` — feat(offers/cms): Phase 3 — OfferVersion snapshots + OFFER_WON → CreateContractFromOfferModal *(2026-04-28)*

`OfferVersion` subcollection written atomically on every status transition; History tab in right panel; `CMSOfferWonHandler` subscribes in `CMSLayout`; `CreateContractFromOfferModal` pre-fills contract draft; `linked_offer_id` back-reference.

---

### Phase 4 — feat(offers): OfferTemplateEditor, bilingual labels, shared PDF engine *(2026-04-28)*

**Motivation:** Three remaining gaps closed to complete the Offers module: (1) templates had no content-editing UI; (2) status labels were hardcoded English everywhere; (3) the PDF engine was duplicated across CMS and Offers.

**4A — OfferTemplateEditor**

*File created:*
- `src/modules/offers/components/OfferTemplateEditor.tsx` — full-screen editor opened from TemplatesPage when user clicks Edit on a template card.
  - **Metadata tab:** name (EN + AR), description (EN + AR), default language.
  - **Sections tab:** ordered section list with up/down reorder, add-from-type-picker, remove, and inline editing of `title_en`, `title_ar`, and `default_content` per section. `default_content` uses a resizable textarea; `dir` follows template language.
  - Local draft copy — no Firestore writes until "Save Template" is clicked.
  - Save calls `updateTemplate(id, {...})` from `useOffersContext` and bumps `version`.

*File modified:*
- `src/modules/offers/pages/TemplatesPage.tsx` — **Edit** button added to active `TemplateCard`; clicking sets `editingTpl` state; when non-null, returns `<OfferTemplateEditor>` in place of the page. `TemplateCard` component now receives `onEdit?` prop. `updateTemplate` no longer imported from context (now handled inside the editor). Create modal note updated to direct users to the editor for content.

**4B — Bilingual labels**

*Files modified:*
- `src/modules/offers/components/WorkflowBadge.tsx` — `lang?: OfferLanguage` prop added (default `'en'`). Badge now renders `STATUS_LABELS[status][lang]`.
- `src/modules/offers/components/OfferCard.tsx` — passes `lang={offer.language}` to `WorkflowBadge` so Arabic offers display Arabic status labels. Also fixes audit F2 (`isExpired` now uses `date-fns` `isBefore(parseISO(expiry_date), startOfDay(new Date()))` to avoid UTC-midnight timezone false positives).
- `src/modules/offers/components/WorkflowPanel.tsx` — all status labels now use `STATUS_LABELS[s][offer.language]`. Transition button labels have bilingual EN/AR entries. "Add Note", "History", "No activity yet" strings switch on `offer.language`.

**4C — Shared PDF engine**

*File created:*
- `src/core/utils/exportPdf.ts` — the canonical export engine (html2canvas + jsPDF + oklch resolver). Public API: `exportToPdf()` and `generatePdfBlob()`.

*Files changed to thin re-exports:*
- `src/modules/offers/utils/exportPdf.ts` — re-exports `exportToPdf` as `exportOfferToPdf`, `generatePdfBlob` as `generateOfferPdfBlob`.
- `src/modules/cms/utils/exportPdf.ts` — re-exports `exportToPdf` and `generatePdfBlob`.

Arch debt F resolved. Both modules use the single implementation in `src/core/utils/exportPdf.ts`.

---

## Source project lineage

This project was built by merging two standalone apps:

| Source repo | Became | Key characteristics |
|---|---|---|
| `jalalmb80/FinArchiTec2_1-main` | `src/modules/finance/` | Firebase, full routing, AppContext reducer |
| `jalalmb80/contracts-main` | `src/modules/cms/` | In-memory mock data, Arabic-only, no Firebase |

The merge introduced: shared AppShell, PlatformContext, platformBus, lazy module loading, and Firebase connectivity for the CMS module.
