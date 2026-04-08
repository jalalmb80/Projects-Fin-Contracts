# 07 — Development Workflow

## Branch strategy

```
main          ← production-ready code only. Never commit directly here.
develop       ← all work happens here first
feature/*     ← optional: branch from develop for larger features
fix/*         ← optional: branch from develop for bug fixes
```

### Rule

**All changes must be pushed to `develop` first.**

`develop` is reviewed, tested, then merged into `main` via pull request.

Direct commits to `main` are not allowed — not even documentation or small fixes.

---

## Setting up the dev environment

### Prerequisites

- Node.js 20+
- npm 10+

### Steps

```bash
# 1. Clone
git clone https://github.com/jalalmb80/Projects-Fin-Contracts.git
cd Projects-Fin-Contracts

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in all VITE_FIREBASE_* values from Firebase Console
# Fill in VITE_GOOGLE_CLIENT_ID from Google Cloud Console (optional)

# 4. Start dev server
npm run dev
# App runs on http://localhost:3000

# 5. Type check
npm run lint   # runs tsc --noEmit
```

### Firebase setup

You need a Firebase project with:
- **Authentication** enabled with Email/Password provider
- **Firestore** database created (start in production mode)
- **Firestore rules** deployed: `firebase deploy --only firestore:rules`

The app seeds default `appSettings` on first load if the document doesn't exist.

---

## How to make a change

1. Check out `develop`: `git checkout develop`
2. Make your changes
3. TypeScript check: `npm run lint` — must pass with zero errors
4. Commit with a descriptive message following the convention below
5. Push to `develop`: `git push origin develop`
6. Open a pull request from `develop` → `main`

---

## Commit message convention

Use conventional commits:

```
type(scope): short description

Optional longer explanation if needed.
```

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructure with no behavior change |
| `docs` | Documentation only |
| `chore` | Dependencies, config, cleanup |
| `style` | Formatting, CSS only |

Scopes: `finance`, `cms`, `core`, `rules`, `docs`

Examples:
```
feat(finance): add export to Excel on billing list page
fix(cms): correct project status values to Arabic enum
refactor(core): simplify platformBus to use WeakMap
docs: update architecture diagram in 02-architecture.md
```

---

## Adding a new Finance page

1. Create `src/modules/finance/pages/NewPage.tsx`
2. Use `const { ... } = useApp()` for data — never import from services or call Firestore directly
3. For notifications: `const { addToast } = useToast()` 
4. Add a route in `src/modules/finance/routes.tsx`
5. Add the nav item to `src/modules/finance/components/Layout.tsx` navigation array

---

## Adding a new CMS page

1. Create `src/modules/cms/pages/NewPage.tsx`
2. Use `const { ... } = useContracts()` for CMS data
3. For notifications: use the inline feedback state pattern (see [04-cms-module.md](./04-cms-module.md))
4. Add a route in `src/modules/cms/routes.tsx`
5. Add the nav item to `src/modules/cms/components/Sidebar.tsx`

---

## Adding a new Firestore collection

1. Add the collection to `firestore.rules` with `allow read, write: if isAuthenticated();`
2. Add the type to the relevant `types.ts`
3. For Finance: add `onSnapshot` in `AppContext` and CRUD functions
4. For CMS: add `onSnapshot` in `useContracts` and CRUD functions
5. Deploy rules: `firebase deploy --only firestore:rules`

---

## Code quality rules

- **No `alert()` calls** — use `addToast()` in Finance, inline feedback state in CMS
- **No direct Firestore calls in pages** — all reads/writes go through `useApp()` or `useContracts()`
- **No service layer files** — the service files were deleted; AppContext/useContracts is the service layer
- **No `as any` on data structures** — only acceptable on DOM event casts (`e.target.value as SomeEnumType`)
- **Match CMS types exactly** — CMS field names are Arabic (`name_ar`, not `name`). Check `cms/types.ts` before writing a form
- **Enum values matter** — `ProjectStatus` in CMS uses Arabic strings. `ProjectStatus` in Finance uses English strings. Do not cross-use them.
