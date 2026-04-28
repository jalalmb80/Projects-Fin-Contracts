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

**Context:** First integration step merging FinArchiTec2.1 and contracts-main. Module registry pattern means new modules need only a single registry entry.

---

### `a5520bf` — Integrate Firebase authentication and Firestore *(2026-04-07)*

- Wired Firebase Auth into `PlatformContext`
- Created `useContracts` hook replacing in-memory CMS mock data with Firestore listeners
- Added `.env.example`

---

### `0ec13f8` — Integrate platform context and improve UI feedback *(2026-04-07)*

- Auth guard for `useContracts`; `ToastProvider` added to Finance routes; CMSDashboard sort fixed.

---

### `16cb78a` — feat(finance): Improve app context and routing *(2026-04-08)*

- `ToastProvider` wraps `AppProvider` (correct order); 57 `console.log` → `addToast()`.

---

### `1ef5485` — Centralize data fetching with AppContext *(2026-04-08)*

- `cms_projects` collection added to `useContracts`; Finance pages use `useApp()`; dead service files deleted.

---

### `0fcc5b4` — Add error handling to cms hooks and currency toggle *(2026-04-08)*

- Error callbacks on all `onSnapshot` calls; currency + dark mode toggles wired.

---

### `3b95af8` — Add legal entity selection to subscription form *(2026-04-08)*

- `SubscriptionForm` → `useApp().legalEntities`; AppContext getDocs id-spread fixed; `cms_settings` rule added.

---

### `f758276` — fix: correct CMS data types, align Client form, replace alert() *(2026-04-08)*

- CMS status enums, Client type alignment, `alert()` → inline feedback.

---

### `ce4faf0` — feat(cms/workflow): Phase 1+2 *(2026-04-19)*

- `WorkflowAssignee` + `WorkflowEvent` types in CMS; `SettingsContext` loads workflow roles; `useContracts.addWorkflowEvent` atomic.

---

### `d8dbb84` — feat(cms/workflow): Phase 3 *(2026-04-19)*

- CMS `WorkflowTransitionModal` + `WorkflowNoteModal` portal components.

---

### `8c4df02` — feat(cms/workflow): Phase 4 *(2026-04-19)*

- CMS `WorkflowTimeline` component.

---

### `5da761f` — feat(cms/workflow): Phase 5 *(2026-04-19)*

- `ContractEditor` wired: status select → `WorkflowTransitionModal` → `addWorkflowEvent` → win side effects.

---

### `ce7c181` — feat(cms/workflow): Phase 6+7 *(2026-04-19)*

- `ContractsList` status change via modal; `CMSSettingsPage` workflow roles section.

---

### `08ee6d1` — feat(finance): enhance dashboard, project list, project detail with full i18n *(2026-04-20)*

- Dashboard real revenue trend, 6 KPI cards, time-aware greeting; ProjectListPage end-date + budget overflow; ProjectDetailPage full bilingual.

---

### `db115c7` — feat(offers): Phase 0 — OffersProvider, atomic offer numbering, subcollection audit trail *(2026-04-28)*

**Motivation:** Three architectural problems — duplicate listeners, Math.random collision risk, 1 MB doc-size risk.

**Files created:** `context/OffersContext.tsx`, `hooks/useOfferDetail.ts`, `docs/09-offers-module.md`

**Key changes:**
- `OffersProvider` wraps `OffersLayout`; pages call `useOffersContext()`
- `generateOfferNumber()` → async `runTransaction` on `appSettings/offerCounter`
- `workflow_log` and `notes` moved to subcollections
- `addWorkflowLogEntry` uses `writeBatch` (status + log entry atomic)
- `WorkflowLogEntry.is_system_generated?: boolean` typed
- Firestore rules: subcollection rules nested in `/offers/{offerId}`

---

### `70dc56a` — feat(offers): Phase 1 — WorkflowAssignee, OfferTransitionModal, OfferNoteModal, OffersSettingsContext *(2026-04-28)*

**Motivation:** Phase 0 fixed data; Phase 1 brings UX to CMS-workflow parity.

**Files created:**
- `context/OffersSettingsContext.tsx` — `OffersSettingsProvider` + `useOffersSettings()`
- `components/OfferTransitionModal.tsx` — portal modal for status transitions
- `components/OfferNoteModal.tsx` — portal modal for audit notes

**Key changes:**
- `WorkflowLogEntry` gains `type: 'transition' | 'note'` + `assignee: WorkflowAssignee`
- `addWorkflowLogEntry` accepts `systemNote?` — all 3 writes in one `writeBatch` (fixes #9)
- `WorkflowPanel` simplified to buttons + timeline; inline form removed
- Firestore rules: `offer_settings` collection added

---

### Phase 2 — feat(offers): OfferPreviewPortal + exportOfferToPdf *(2026-04-28)*

**Motivation:** Offers had no way to preview or export to PDF. CMS contracts have had this since the initial build; parity requires it for any offer sent to a client.

**Files created:**
- `src/modules/offers/utils/exportPdf.ts` — full html2canvas + jsPDF pipeline with oklch→rgb color resolver. Identical engine to `cms/utils/exportPdf.ts`, kept module-local to preserve module independence. Phase 4 may extract shared engine to `src/core/utils/exportPdf.ts`.
- `src/modules/offers/components/OfferPreviewPortal.tsx` — bilingual, section-type-aware preview portal.

**Files modified:**
- `src/modules/offers/pages/OfferBuilderPage.tsx` — Preview button (opens full modal) + PDF button (direct download). `previewMode: 'preview' | 'download' | null` state; renders `OfferPreviewPortal`.
- `src/modules/offers/index.ts` — exports `exportOfferToPdf`, `generateOfferPdfBlob`, `OfferPreviewPortal`.

**Design decisions:**

*Two-mode portal (preview vs download):* Same pattern as `ContractPreviewPortal`. In `download` mode the portal renders off-screen, auto-triggers export after `2 rAF + 300 ms`, then calls `onClose`. In `preview` mode it opens a full-screen modal with Download and Print actions.

*Section-type-aware rendering:*
- `cover_page` → styled metadata header (offer number, client, expiry, status badge)
- `pricing_table` → live `offer.line_items` table with subtotal / discount / VAT / total rows
- `payment_schedule` → three KPI cards (subtotal, VAT, total) + section content
- `signature_block` → two-column signature area (Supplier / Client)
- All others → `<h2>` title + `dangerouslySetInnerHTML` for rich-text content

*Bilingual:* `offer.language` drives `dir`, section title field (`title_en` vs `title_ar`), Arabic font stack (`Tajawal`) vs system font, and all UI strings in the document body. The toolbar is always in English (same as the builder UI).

*Automatic document header:* When no `cover_page` section exists, a compact metadata header renders above the section list. When a `cover_page` section is present, it provides the full cover and the auto-header is suppressed.

*`dangerouslySetInnerHTML` rationale:* Section content is authored by authenticated users within their own session. No third-party or user-submitted HTML is ever rendered. Risk is equivalent to a rich-text contract article in the CMS module.
