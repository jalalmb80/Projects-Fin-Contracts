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

**Context:** The CMS module originally ran entirely on mock data (`mockData.ts`). This commit replaced all mock data references with live Firestore reads and writes. The `useContracts` hook was modeled after AppContext's onSnapshot pattern.

---

### `0ec13f8` — Integrate platform context and improve UI feedback *(2026-04-07)*

- Added auth guard to `useContracts` — listeners only open when `user` is non-null
- Removed dead `notification` state from `AppContext` (it was writing to state but never rendering)
- Added `ToastProvider` to Finance routes (was missing — caused crash on Subscriptions, Products, ProjectDetail)
- Fixed `CMSDashboardPage` sort — was using `c.created_at` which doesn't exist on `Contract` type; changed to `c.start_date`

**Context:** This commit fixed the first set of runtime crashes reported after the initial integration. The ToastProvider gap was the most critical — the app would crash immediately on three Finance pages.

---

### `16cb78a` — feat(finance): Improve app context and routing *(2026-04-08)*

- Fixed provider order: moved `ToastProvider` to wrap `AppProvider` (it was previously nested inside — `AppContext` calls `useToast()` so it must be the child, not the parent)
- Replaced all 57 `console.log('[AppContext]', ...)` calls with real `addToast()` calls — users now see success/error feedback for all CRUD operations
- Fixed `CMSDashboardPage` to use `useContracts().clients` instead of `usePlatform().counterparties` (which no longer existed after PlatformContext cleanup)
- Deleted `temp_billing.tsx` from repo root

**Context:** The provider order bug was subtle — AppContext was trying to call useToast() but it was outside ToastProvider, causing a crash. Moving ToastProvider one level up fixed it. The console.log cleanup restored user-visible feedback that was lost when the notification system was removed.

---

### `1ef5485` — Centralize data fetching with AppContext *(2026-04-08)*

- Added `cms_projects` collection to `useContracts` hook
- Added Firestore rules for `cms_projects`
- Fixed `useContracts` snapshot mapping — changed `d.data()` to `{ id: d.id, ...d.data() }` across all 4 listeners (same fix as AppContext's pattern)
- Refactored `CounterpartiesPage`, `InvoiceForm`, `ProjectForm`, `SubscriptionForm` to use `useApp()` instead of the now-deleted `counterpartyService` and `projectService` service files
- Deleted all 5 unused service files, `ProtectedRoute.tsx`, and `temp_cms/types.ts`

**Context:** The service files were an artifact of the original FinArchiTec app's architecture. After AppContext was wired with real-time listeners, the services were redundant and caused stale data issues — edits in CounterpartiesPage didn't update the Finance forms until page reload. Removing them and using AppContext directly fixed the consistency problem.

---

### `0fcc5b4` — Add error handling to cms hooks and currency toggle *(2026-04-08)*

- Added error callbacks to all 4 `onSnapshot` calls in `useContracts` — silent failures now log error code and set `loading: false`
- Wired the currency toggle button in Finance `Layout.tsx` to `setDisplayCurrency()` from AppContext
- Wired the dark mode toggle button to `document.documentElement.classList.toggle('dark')`
- Deleted `src/modules/finance/hooks/useToast.ts` (dead code)

---

### `3b95af8` — Add legal entity selection to subscription form *(2026-04-08)*

- `SubscriptionForm` now populates a Legal Entity dropdown from `useApp().legalEntities` instead of hardcoding `legalEntityId: 'default'`
- Fixed AppContext `getDocs` for products, legalEntities, budgetCategories to use `{ id: d.id, ...d.data() }` instead of `d.data()` — consistent with onSnapshot pattern
- Added Firestore rule for `cms_settings` collection
- Deleted `src/modules/finance/hooks/useToast.ts`

**Context:** Every subscription created before this fix had `legalEntityId: 'default'` — a non-existent entity ID. This fix also covered the id-spread bug: any document created outside the app (Firebase Console, migrations) wouldn't have its `id` correctly hydrated without the spread.

---

### `f758276` — fix: correct CMS data types, align Client form, replace alert() with inline feedback and toast *(2026-04-08)*

- **CMSProjectsPage** — project `status` values corrected from English strings (`'Active'`, `'Completed'`, `'On Hold'`) to the correct Arabic `ProjectStatus` type values (`'مخطط'`, `'قيد التنفيذ'`, `'مكتمل'`, `'معلّق'`). All saved projects previously had structurally invalid status values.
- **CMSClientsPage** — complete form overhaul. Previous form saved English-named fields (`name`, `nameAr`, `contactPerson`, `taxId`) but the `Client` type expects Arabic-named fields (`name_ar`, `entity_type`, `representative_name`, etc.). Form now matches the type exactly with all required fields.
- **CMSSettingsPage** — replaced both `alert()` calls with inline feedback state pattern.
- **BillingDetailPage** — replaced `alert('Invalid payment amount')` with `addToast('error', ...)` — consistent with the rest of Finance.

**Context:** This was a data integrity fix. Any CMS clients or projects saved before this commit were stored with the wrong field names and invalid enum values. New records created after this commit are structurally correct.

---

## Source project lineage

This project was built by merging two standalone apps:

| Source repo | Became | Key characteristics |
|---|---|---|
| `jalalmb80/FinArchiTec2_1-main` | `src/modules/finance/` | Firebase, full routing, AppContext reducer |
| `jalalmb80/contracts-main` | `src/modules/cms/` | In-memory mock data, Arabic-only, no Firebase |

The merge introduced: shared AppShell, PlatformContext, platformBus, lazy module loading, and Firebase connectivity for the CMS module.

A previous merged version (`jalalmb80/Projects-Management-main`) was reviewed and superseded by this repo (`jalalmb80/Projects-Fin-Contracts`) which contains all fixes applied.
