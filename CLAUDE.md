# Instructions for Claude (AI Assistant)

This file tells you — Claude or any AI assistant — exactly how to work on this project.
Read this file completely before doing anything else.

---

## 1. Understand the project first

This is a **private internal business platform** with two modules:
- **Finance** — invoices, projects, subscriptions, payments (English UI)
- **CMS** — Arabic legal contract management (Arabic-first, RTL)

Before writing any code, clone the repo and read the docs in this order:

```
docs/INDEX.md                  ← routing guide, read first
docs/01-project-overview.md    ← what the app does
docs/02-architecture.md        ← how the code is structured
docs/03-finance-module.md      ← if working on Finance
docs/04-cms-module.md          ← if working on CMS
docs/05-firebase-and-security.md ← Firestore collections + rules
docs/06-change-history.md      ← why the code looks the way it does
docs/08-known-issues-and-todos.md ← what is already broken / deferred
```

---

## 2. Always recheck the repo before starting

Before making any change, clone the latest state of the repo:

```
GIT_TERMINAL_PROMPT=0 git clone https://github.com/jalalmb80/Projects-Fin-Contracts.git /tmp/project
```

Then run the TypeScript check to see if there are existing errors:

```
cd /tmp/project && npm install --silent 2>/dev/null && npx tsc --noEmit 2>&1
```

This tells you the current baseline. Do not introduce new errors.

---

## 3. Branch rule — never commit to main

**All changes go to `develop` first. No exceptions.**

```
develop  ←  all your commits go here
main     ←  never touch this directly
```

When pushing files via the GitHub API, always set `branch: "develop"`.

---

## 4. The five rules that must never be broken

1. **No `alert()` calls.**
   - Finance pages: use `const { addToast } = useToast()` → `addToast('success'|'error', 'message')`
   - CMS pages: use inline feedback state (see `docs/04-cms-module.md` for the pattern)

2. **No direct Firestore calls in pages or components.**
   - Finance: all reads/writes go through `useApp()` from `AppContext`
   - CMS: all reads/writes go through `useContracts()` from the hook
   - Exception: `CMSSettingsPage` reads/writes `cms_settings` directly (it has no hook equivalent yet)

3. **CMS types use Arabic field names.**
   Always check `src/modules/cms/types.ts` before writing a CMS form or component.
   Fields are `name_ar`, `client_id`, `amount_sar`, `representative_name` — not English equivalents.
   `ProjectStatus` values are Arabic strings: `'مخطط' | 'قيد التنفيذ' | 'مكتمل' | 'معلّق'`

4. **Provider order in Finance routes must be:**
   ```
   <ToastProvider>       ← outer
     <AppProvider>       ← inner  (AppProvider calls useToast internally)
       <Routes>
   ```
   If you ever modify `src/modules/finance/routes.tsx`, do not reverse this order.

5. **Every new Firestore collection needs a rule.**
   If you add a collection, add a matching rule to `firestore.rules`:
   ```
   match /your_collection/{document=**} {
     allow read, write: if isAuthenticated();
   }
   ```

---

## 5. How to do a proper recheck

When asked to "recheck the project", do this:

```bash
# Clone fresh
cd /tmp && rm -rf project
GIT_TERMINAL_PROMPT=0 git clone https://github.com/jalalmb80/Projects-Fin-Contracts.git project

# Install and type-check
cd project && npm install --silent 2>/dev/null && npx tsc --noEmit 2>&1

# Then check these specific things:
grep -n "alert(" src -r --include="*.tsx"                          # alert() calls
grep -rln "from 'firebase/firestore'" src/modules --include="*.tsx" | grep "pages/"  # raw Firestore in pages
grep -n "useToast\|ToastProvider" src/modules/finance/routes.tsx   # provider order
grep "cms_projects\|cms_settings\|cms_clients" firestore.rules     # rules coverage
cat firestore.rules                                                  # full rules review
npx tsc --noEmit 2>&1                                               # TS errors
```

---

## 6. How to fix a bug

1. Read the relevant doc file first (listed in section 1 above)
2. Clone and read the actual file you'll be changing
3. Make the minimal change needed — do not refactor unrelated code
4. Run `npx tsc --noEmit` — must produce zero errors
5. Push to `develop` with a descriptive commit message:
   ```
   fix(scope): short description of what was wrong and what you did
   ```
6. Update `docs/08-known-issues-and-todos.md` if the fix closes an open issue

---

## 7. How to write prompts for AI Studio

When the developer asks you to "write a prompt" for AI Studio to fix something:

- Be precise about the file path and the exact lines to change
- Show the current (broken) code and the expected (fixed) code side by side
- Specify which files to attach
- End with "Return the complete updated [filename]" — not just the changed section
- If the fix spans multiple files, number the files and describe each fix separately
- Always include the rule: push to `develop` branch

---

## 8. How to push documentation updates

When you update docs, always:
1. Keep the same 8-file structure under `docs/`
2. Update `docs/08-known-issues-and-todos.md` when bugs are fixed or new ones are found
3. Update `docs/06-change-history.md` when significant commits are made
4. Push to `develop`, not `main`

---

## 9. What to do if you're unsure

If you're unsure whether a change is correct:

1. Check `docs/06-change-history.md` — a similar issue may have been fixed before
2. Check `docs/08-known-issues-and-todos.md` — it may be a known deferred item
3. Read the actual TypeScript type before writing form fields
4. Ask before refactoring — large structural changes require explicit instruction

---

## 10. Current open items (as of 2026-04-08)

These are the known issues that have **not yet been fixed**.
Do not attempt to fix these unless explicitly asked:

| # | Issue | File | Severity |
|---|---|---|---|
| 1 | `useContracts` creates multiple listener instances per page | `cms/hooks/useContracts.ts` | Medium |
| 2 | Two `alert()` calls remain in ContractEditor | `cms/components/ContractEditor.tsx` | Low |
| 3 | Dark mode toggle works mechanically but no `dark:` CSS exists | `finance/components/Layout.tsx` | Low |
| 4 | Google Drive upload not connected to attachment UI | `cms/services/googleDrive.ts` | Low |
| 5 | BillingDetailPage Edit button has no handler/route | `finance/pages/BillingDetailPage.tsx` | Medium |
| 6 | `billingInterval` field on Subscription is unused | `finance/types.ts` | Low |
| 7 | Payment allocation in BillingDetailPage bypasses `allocatePayment()` | `finance/pages/BillingDetailPage.tsx` | Medium |

---

## 11. Tech stack quick reference

| | |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Backend | Firebase Firestore + Firebase Auth |
| Icons | Lucide React |
| Charts | Recharts |
| PDF | html2pdf.js |

---

## 12. Key file locations

| What | Where |
|---|---|
| Finance state + all CRUD | `src/modules/finance/context/AppContext.tsx` |
| CMS state + all CRUD | `src/modules/cms/hooks/useContracts.ts` |
| Auth + shell routing | `src/core/components/AppShell.tsx` |
| Cross-module events | `src/core/events/platformBus.ts` |
| Module registry | `src/core/registry.tsx` |
| Finance types | `src/modules/finance/types.ts` |
| CMS types (Arabic fields) | `src/modules/cms/types.ts` |
| Firestore rules | `firestore.rules` |
| Environment variables | `.env.example` |
