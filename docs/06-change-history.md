# 06 — Change History

This document records every meaningful change made to the project, including the context behind architectural decisions. Commit SHAs are included for traceability.

---

## Commit history (oldest → newest)

---

### `c34925c` — Initial commit *(2026-04-07)*
GitHub's automatic initial commit.

---

### `a6931d2` — Initialize project structure and dependencies *(2026-04-07)*
Modular platform shell, Finance + CMS modules, Vite + React + TypeScript + Tailwind.

---

### `a5520bf` — Integrate Firebase authentication and Firestore *(2026-04-07)*
Firebase Auth in PlatformContext; `useContracts` replaces in-memory CMS mock data.

---

### `0ec13f8` — Integrate platform context and improve UI feedback *(2026-04-07)*
Auth guard for `useContracts`; `ToastProvider` added; CMSDashboard sort fixed.

---

### `16cb78a` — feat(finance): Improve app context and routing *(2026-04-08)*
`ToastProvider` wraps `AppProvider`; 57 `console.log` → `addToast()`.

---

### `1ef5485` — Centralize data fetching with AppContext *(2026-04-08)*
`cms_projects` added to `useContracts`; Finance pages use `useApp()`; dead service files deleted.

---

### `0fcc5b4` — Add error handling to cms hooks and currency toggle *(2026-04-08)*
Error callbacks on all `onSnapshot` calls; currency + dark mode toggles wired.

---

### `3b95af8` — Add legal entity selection to subscription form *(2026-04-08)*
`SubscriptionForm` → `useApp().legalEntities`; id-spread fix; `cms_settings` rule added.

---

### `f758276` — fix: correct CMS data types, align Client form, replace alert() *(2026-04-08)*
CMS status enums, Client type alignment, `alert()` → inline feedback.

---

### `ce4faf0` — feat(cms/workflow): Phase 1+2 *(2026-04-19)*
CMS `WorkflowAssignee` + `WorkflowEvent`; `SettingsContext` loads roles; `useContracts.addWorkflowEvent` atomic.

---

### `d8dbb84` — feat(cms/workflow): Phase 3 *(2026-04-19)*
CMS `WorkflowTransitionModal` + `WorkflowNoteModal` portal components.

---

### `8c4df02` — feat(cms/workflow): Phase 4 *(2026-04-19)*
CMS `WorkflowTimeline` component.

---

### `5da761f` — feat(cms/workflow): Phase 5 *(2026-04-19)*
`ContractEditor` wired: status select → `WorkflowTransitionModal` → `addWorkflowEvent` → win side effects.

---

### `ce7c181` — feat(cms/workflow): Phase 6+7 *(2026-04-19)*
`ContractsList` status change via modal; `CMSSettingsPage` workflow roles section.

---

### `08ee6d1` — feat(finance): enhance dashboard, project list, project detail tabs with full i18n *(2026-04-20)*
Dashboard real revenue trend + 6 KPI cards; ProjectListPage + ProjectDetailPage fully bilingual.

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
