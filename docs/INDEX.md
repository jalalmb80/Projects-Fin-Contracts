# Documentation Index — Projects-Fin-Contracts

> **Read this file first.** It tells you which doc to open based on what you need to do.

---

## Branch rule

**All changes must be pushed to `develop` first. Never commit directly to `main`.**

`develop` → reviewed → merged into `main`

---

## Who are you? Go here first.

| You need to… | Read this |
|---|---|
| Understand what this app does | [01-project-overview.md](./01-project-overview.md) |
| Understand how the code is structured | [02-architecture.md](./02-architecture.md) |
| Work on billing, invoices, subscriptions, projects | [03-finance-module.md](./03-finance-module.md) |
| Work on contracts, clients, templates | [04-cms-module.md](./04-cms-module.md) |
| Set up Firebase, understand Firestore rules, or handle auth | [05-firebase-and-security.md](./05-firebase-and-security.md) |
| Understand why the code looks the way it does | [06-change-history.md](./06-change-history.md) |
| Submit a PR, follow conventions, set up dev environment | [07-development-workflow.md](./07-development-workflow.md) |
| Pick up where the last developer left off | [08-known-issues-and-todos.md](./08-known-issues-and-todos.md) |

---

## Five things every developer must know before touching code

1. **Two modules, one shell.** Finance and CMS are separate lazy-loaded modules under a shared `AppShell`. They don't share components or context — they communicate only through `platformBus` events.

2. **State lives in two contexts.** Finance state lives in `AppContext` (`src/modules/finance/context/AppContext.tsx`). CMS state lives in the `useContracts` hook (`src/modules/cms/hooks/useContracts.ts`). `PlatformContext` only holds auth user and active module — nothing else.

3. **The CMS module is Arabic-first.** All CMS data fields use Arabic naming (`name_ar`, `representative_name`, `license_no`, etc.). The `Client` and `Project` types in `src/modules/cms/types.ts` are the source of truth — always check the type before writing form fields.

4. **Toast notifications, not alerts.** Finance uses `useToast()` from `Toast.tsx`. CMS pages use an inline `feedback` state pattern. `alert()` and `window.confirm()` are banned for success/error feedback.

5. **`develop` branch first.** No direct commits to `main`. Open a PR from `develop` to `main` for every change.

---

## File map — quick reference

```
src/
  core/                          Shared shell, auth, routing
    components/AppShell.tsx      Top-level router — handles auth gate
    components/ModuleSwitcher.tsx Sidebar icon switcher between modules  
    context/PlatformContext.tsx  Auth user + active module only
    events/platformBus.ts        Cross-module event bus
    firebase.ts                  Firebase init
    pages/LoginPage.tsx          Shared login page
    registry.tsx                 Module registration list

  modules/
    finance/                     Finance module
      context/AppContext.tsx     All Finance state + CRUD — read this first
      routes.tsx                 Finance router + provider tree
      pages/                     One file per page
      components/                Forms and UI components
      types.ts                   All Finance TypeScript types

    cms/                         CMS (Contracts) module  
      hooks/useContracts.ts      All CMS state + CRUD — read this first
      routes.tsx                 CMS router
      pages/                     One file per page
      components/                ContractEditor, ContractsList, etc.
      types.ts                   All CMS TypeScript types (Arabic field names)

firestore.rules                  Firestore security rules
firebase.json                    Firebase project config
.env.example                     Required environment variables
```
