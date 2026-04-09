# 02 — Architecture

## Overview

The app is a **modular single-page application**. A shared platform shell owns routing and auth. Each module is a self-contained lazy-loaded React subtree with its own router, state, and UI.

```
BrowserRouter
  └── PlatformProvider          (auth user + active module)
        └── AppShell
              ├── /login        → LoginPage (core/pages/)
              ├── ModuleSwitcher (left sidebar — switches modules)
              └── /finance/*    → FinanceRoutes (lazy)
              └── /cms/*        → CMSRoutes (lazy)
```

---

## Provider tree — Finance module

```
LanguageProvider
  └── ToastProvider             ← must be outside AppProvider so AppProvider can call useToast()
        └── AppProvider         ← all Finance state, CRUD, real-time listeners
              └── <Routes>
                    └── Layout  ← sidebar + header
                          └── <Outlet> → pages
```

**Critical:** `ToastProvider` wraps `AppProvider`. This is required because `AppContext` calls `useToast()` internally to show success/error toasts after every CRUD operation. If you reverse this order the app crashes on any Finance page.

---

## Provider tree — CMS module

```
LanguageProvider
  └── SettingsProvider
        └── CMSLayout           ← sidebar
              └── <Outlet> → pages
```

CMS has no global state provider. Data comes from the `useContracts()` hook, which each page calls directly. This hook opens Firestore `onSnapshot` listeners internally and returns data + CRUD functions.

---

## PlatformContext — what it does and doesn't do

`PlatformContext` is intentionally minimal. It holds:
- `user` — the Firebase auth user (or null)
- `loadingAuth` — true while Firebase is resolving the session
- `activeModule` — which module is selected in `ModuleSwitcher`
- `setActiveModule` — setter for the above

It does **not** hold counterparties, projects, or any business data. These were removed to eliminate double Firestore reads (Finance `AppContext` already subscribes to the same collections).

---

## Data flow — Finance

```
Firestore (real-time)
    ↓  onSnapshot listeners (5 collections)
AppContext reducer
    ↓  dispatches SET_COLLECTION
React state (projects, billingDocuments, payments, subscriptions, counterparties)
    ↓  useApp() hook
Page components
```

One-time fetches (products, legalEntities, budgetCategories) use `getDocs` on mount instead of `onSnapshot` — these collections change rarely and don't need real-time sync.

---

## Data flow — CMS

```
Firestore (real-time)
    ↓  onSnapshot listeners (4 collections)
useContracts() hook state
    ↓  returned from hook
Page components
```

The CMS has no reducer — each collection is its own `useState`. The hook is called once per page that needs data. Because the hook creates a new listener instance per call, pages that mount simultaneously open multiple identical listeners. This is a known inefficiency — see [08-known-issues-and-todos.md](./08-known-issues-and-todos.md).

---

## Cross-module communication

Modules communicate through `platformBus` — a lightweight in-memory pub/sub event bus at `src/core/events/platformBus.ts`.

Currently one event is wired:

| Event | Emitter | Listener | Effect |
|---|---|---|---|
| `CONTRACT_SIGNED` | `ContractEditor.tsx` (CMS) | `BillingFormPage.tsx` (Finance) | Auto-fills a new billing document with contract data |

To add a new cross-module event: define it in `PLATFORM_EVENTS`, emit it in the source module, subscribe in the target module's `useEffect`.

---

## File naming conventions

- Pages: `PascalCasePage.tsx` (e.g. `BillingDetailPage.tsx`)
- Components: `PascalCase.tsx` (e.g. `CounterpartyForm.tsx`)
- Hooks: `useCamelCase.ts` (e.g. `useContracts.ts`)
- Context: `PascalCaseContext.tsx` (e.g. `AppContext.tsx`)
- Types: `types.ts` per module root
- Utils: `camelCase.ts` (e.g. `hijriDate.ts`)

---

## Module registration

Modules are registered in `src/core/registry.tsx`. Adding a new module requires:
1. Creating the module folder under `src/modules/`
2. Adding a `routes.tsx` export
3. Adding an entry to the `MODULES` array in `registry.tsx` with `id`, `name`, `nameAr`, `icon`, `basePath`, `color`, and `component`

The `AppShell` and `ModuleSwitcher` will pick it up automatically.
