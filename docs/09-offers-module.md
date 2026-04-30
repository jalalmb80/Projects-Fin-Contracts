# 09 — Offers Module

## Location

`src/modules/offers/`

---

## Purpose

The Offers module generates, manages, and tracks commercial proposals. Supports bilingual content (EN/AR), structured sections, line-item pricing, a workflow state machine with immutable audit trail, version history, internal notes, and PDF export. When an offer is won, a `platformBus` event triggers CMS contract creation.

---

## Provider architecture

```
OffersProvider            (onSnapshot: offers + offer_templates)
  OffersSettingsProvider  (getDoc: offer_settings/general)
    OffersLayoutInner     (sidebar + Outlet)
```

| Provider | Hook | Source |
|---|---|---|
| `OffersProvider` | `useOffersContext()` | `offers` + `offer_templates` onSnapshot |
| `OffersSettingsProvider` | `useOffersSettings()` | `offer_settings/general` getDoc |

### useOffersContext — key methods

| Method | Purpose |
|---|---|
| `createOffer(offer, initialEntry)` | Batch: offer doc + first workflow_log entry |
| `updateOffer(id, data)` | Partial offer update |
| `addWorkflowLogEntry(offerId, entry, newStatus?, systemNote?, versionSnapshot?)` | Atomic writeBatch: log + status + note + version |
| `addNote(offerId, note)` | Write to `offers/{id}/notes` |
| `updateSections / updateLineItems` | Embedded array mutations |
| `createTemplate / updateTemplate / archiveTemplate` | Template CRUD |

---

## Per-offer hooks (OfferBuilderPage only)

| Hook | Data | Subcollection |
|---|---|---|
| `useOfferDetail(id)` | `workflowLog[]`, `notes[]` | `workflow_log`, `notes` |
| `useOfferVersions(id)` | `versions[]` | `versions` |

---

## Offer numbering

`generateOfferNumber()` is async — `runTransaction` on `appSettings/offerCounter`.
Format: `OFF-{year}-{seq 4-padded}` — e.g. `OFF-2026-0001`

---

## Subcollection architecture

| Subcollection | Path | Rules |
|---|---|---|
| workflow_log | `offers/{offerId}/workflow_log/{entryId}` | create only |
| notes | `offers/{offerId}/notes/{noteId}` | create + update (pin) |
| versions | `offers/{offerId}/versions/{versionId}` | create only |

---

## Version history

`OfferVersion` is written on each status transition inside `addWorkflowLogEntry`'s `writeBatch`. Displayed in the **History** tab in `OfferBuilderPage`. Snapshot restore is not yet implemented.

---

## Workflow transition flow

1. Transition button → `onTransitionRequest(toStatus)` → `OfferTransitionModal`
2. Modal: role + name (required) + reason (required if `REASON_REQUIRED`)
3. `handleTransitionConfirm` → builds systemNote + versionSnapshot → single atomic `writeBatch`
4. If `won` → emits `OFFER_WON` → `CMSOfferWonHandler` → `CreateContractFromOfferModal`

---

## Template editor (Phase 4)

**File:** `offers/components/OfferTemplateEditor.tsx`

Full-screen overlay opened from `TemplatesPage` when user clicks **Edit** on a template card.

| Tab | Content |
|---|---|
| Metadata | name (EN + AR), description (EN + AR), default language |
| Sections | Ordered list: up/down reorder, add from type picker, remove, inline editing of title_en / title_ar / default_content |

`default_content` in each section is what gets pre-filled when an offer is created from the template. Save bumps `version`.

---

## Bilingual labels (Phase 4)

`WorkflowBadge` accepts `lang?: OfferLanguage` (default `'en'`). Pass `offer.language` in offer-specific contexts:
- `OfferCard` → `lang={offer.language}`
- `WorkflowPanel` → all status labels, transition button labels, and UI strings use `offer.language`

Global contexts (dashboard status breakdown, list filter chips) remain English-only since they aggregate all offers regardless of language.

---

## PDF export (Phase 2 + 4)

**Engine:** `src/core/utils/exportPdf.ts` (canonical, shared with CMS)
**Offer wrapper:** `offers/utils/exportPdf.ts` (thin re-export: `exportOfferToPdf`, `generateOfferPdfBlob`)

Trigger points in `OfferBuilderPage`:
- **Preview** (Eye) → `setPreviewMode('preview')` → `OfferPreviewPortal` full-screen modal
- **PDF** (FileDown) → `setPreviewMode('download')` → off-screen render + auto-download

---

## Offer state machine

```
draft → under_review
under_review → revised | pending_approval | lost
revised → under_review | draft
pending_approval → approved | under_review
approved → sent_to_client | draft
sent_to_client → won | lost
won → archived
lost → archived
expired → archived  (inbound: scheduled Cloud Function only)
archived → (terminal)
```

`REASON_REQUIRED = ['revised', 'lost']`

---

## Pages

| Page | Route | Right-panel tabs |
|---|---|---|
| `OffersDashboardPage` | `/offers` | — |
| `OffersListPage` | `/offers/list` | — |
| `OfferBuilderPage` | `/offers/builder/:id` | Workflow \| Notes \| History |
| `TemplatesPage` | `/offers/templates` | — (opens OfferTemplateEditor overlay) |

---

## Firestore collections

| Collection | Description |
|---|---|
| `offers` | Offer docs; embeds `sections[]` and `line_items[]` |
| `offers/{id}/workflow_log` | Immutable audit trail |
| `offers/{id}/notes` | Internal notes |
| `offers/{id}/versions` | Immutable content snapshots |
| `offer_templates` | Templates with per-section `default_content` |
| `appSettings/offerCounter` | Atomic sequence counter |
| `offer_settings/general` | Config: `workflow_roles[]` |

---

## Cross-module events

| Event | Emitted | Payload | Subscriber |
|---|---|---|---|
| `OFFER_WON` | OfferBuilderPage on `won` | `{ offerId, offerNumber, clientId, clientName, totalValue }` | `CMSOfferWonHandler` → `CreateContractFromOfferModal` |

---

## Feedback pattern

Inline toast state — no `ToastProvider` dependency. Do not add `alert()` calls.

---

## Known gaps

- Version snapshot restore UI
- Status labels not settings-driven
- No settings UI for `offerWorkflowRoles`
- `expired` status needs a scheduled Cloud Function
- OFFER_WON handler is module-scoped (only fires when CMS is mounted) — tracked in docs/08 issue #14

See `docs/08-known-issues-and-todos.md` for the full tracker.
