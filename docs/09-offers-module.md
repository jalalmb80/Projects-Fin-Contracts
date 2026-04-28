# 09 — Offers Module

## Location

`src/modules/offers/`

## Entry point

`src/modules/offers/routes.tsx`

---

## Purpose

The Offers module generates, manages, and tracks commercial proposals sent to clients. It supports bilingual content (EN / AR), structured sections, line-item pricing, a workflow state machine, an immutable audit trail, and internal notes. Offers are the pre-sales counterpart to CMS Contracts — when an offer is won, a platformBus event fires so the CMS module can create the corresponding contract.

---

## OffersProvider — the data layer

**File:** `src/modules/offers/context/OffersContext.tsx`

`OffersProvider` wraps `OffersLayout` and runs `useOffers()` exactly once, opening a single set of Firestore listeners regardless of how many pages are mounted. All pages call `useOffersContext()` — never `useOffers()` directly.

### What it manages

| Collection | Firestore path | Order |
|---|---|---|
| offers | `offers` | `created_at` desc |
| offer templates | `offer_templates` | `created_at` desc |

### Key methods exposed via context

| Method | Purpose |
|---|---|
| `createOffer(offer, initialWorkflowEntry)` | Batch write: offer doc + first workflow_log subcollection entry, atomic |
| `updateOffer(id, data)` | Partial update on the offer document |
| `addWorkflowLogEntry(offerId, entry, newStatus?)` | Batch write: subcollection entry + status update, atomic |
| `addNote(offerId, note)` | Write to `offers/{id}/notes` subcollection |
| `updateSections(offerId, sections)` | Replace the embedded sections array |
| `updateLineItems(offerId, items, discountPct, vatRate)` | Replace line items + recalculate and store totals |
| `createTemplate` / `updateTemplate` / `archiveTemplate` | Template CRUD |

---

## useOfferDetail hook

**File:** `src/modules/offers/hooks/useOfferDetail.ts`

Used exclusively in `OfferBuilderPage`. Subscribes to the per-offer subcollections.

| Subcollection | Firestore path | Order |
|---|---|---|
| workflow_log | `offers/{id}/workflow_log` | `created_at` desc |
| notes | `offers/{id}/notes` | `created_at` desc |

Returns `{ workflowLog, notes, loadingDetail }`.

---

## Offer numbering

**File:** `src/modules/offers/utils/offerNumber.ts`

`generateOfferNumber()` is **async**. It uses a Firestore `runTransaction` on `appSettings/offerCounter` to atomically increment `lastSequence` and return a collision-safe number.

Format: `OFF-{year}-{sequence padded to 4 digits}` — e.g. `OFF-2026-0001`

Same pattern as Finance invoice numbering (`appSettings/invoiceCounter`).

---

## Subcollection architecture

As of Phase 0 (2026-04-28), `workflow_log` and `notes` are Firestore subcollections rather than embedded arrays. This prevents documents from approaching the 1 MB Firestore limit as notes and audit trail grow over time.

| Subcollection | Path | Immutable? |
|---|---|---|
| workflow_log | `offers/{offerId}/workflow_log/{entryId}` | Yes — create only |
| notes | `offers/{offerId}/notes/{noteId}` | No — update allowed (pin toggle) |

**Migration:** Offers created before Phase 0 may still have embedded `workflow_log` and `notes` arrays in the document. These fields are typed as `optional` on `Offer` and are marked `@deprecated`. Old data is not migrated automatically — the subcollection subscriptions will simply return empty for pre-Phase-0 documents until those offers are transitioned again.

---

## Offer state machine

**File:** `src/modules/offers/utils/stateMachine.ts`

```
draft → under_review
under_review → revised | pending_approval | lost
revised → under_review | draft
pending_approval → approved | under_review
approved → sent_to_client | draft
sent_to_client → won | lost
won → archived
lost → archived
expired → archived
archived → (terminal)
```

`REASON_REQUIRED = ['revised', 'lost']` — transitions to these states require a written reason.

**Note:** `expired` has no inbound transitions in the current state machine. It is intended to be set by a future scheduled function that checks `expiry_date`. Until that function exists, `expired` is effectively unreachable through the UI.

---

## Pages

| Page | Route | Purpose |
|---|---|---|
| `OffersDashboardPage` | `/offers` | KPI cards, status breakdown, recent offers table |
| `OffersListPage` | `/offers/list` | Offer list with status filters, search, and New Offer modal |
| `OfferBuilderPage` | `/offers/builder/:id` | Three-panel editor: section navigator / content editor / workflow+notes sidebar |
| `TemplatesPage` | `/offers/templates` | Template CRUD — create templates with section type lists |

---

## OfferBuilderPage — the core editor

**File:** `src/modules/offers/pages/OfferBuilderPage.tsx`

Three-panel layout:
- **Left** — `SectionNavigator`: ordered section list with move/remove/add controls
- **Center** — `SectionEditor`: content editor per section; dispatches to `PricingSection` when `section.type === 'pricing_table'`
- **Right** — tabbed panel: `WorkflowPanel` (audit trail + transitions) and `NotesPanel` (internal notes)

### Read-only mode

Statuses `approved`, `sent_to_client`, `won`, `lost`, `archived` set `readOnly = true`. The center editor and pricing table disable all inputs. The workflow panel still shows available transitions (e.g. `won → archived`).

---

## Workflow audit trail

`WorkflowPanel` receives `workflowLog: WorkflowLogEntry[]` as a prop (sourced from `useOfferDetail`). Entries are stored newest-first in the subcollection via `orderBy('created_at', 'desc')`.

The transition flow:
1. User selects a target status in `WorkflowPanel`
2. `OfferBuilderPage.handleTransition` builds a `WorkflowLogEntry` + system `OfferNote`
3. `addWorkflowLogEntry(offerId, entry, toStatus)` — atomic batch (status + log entry)
4. `addNote(offerId, systemNote)` — separate write (Phase 1 will batch with step 3)
5. If `toStatus === 'won'`, emits `PLATFORM_EVENTS.OFFER_WON` via `platformBus`

**Known gap (Phase 1):** The system note in step 4 is written after step 3. If step 3 succeeds and step 4 fails, the status changes without a system note. This is tracked in `docs/08-known-issues-and-todos.md`.

---

## Pricing

**File:** `src/modules/offers/utils/pricing.ts`

- `calculateLineTotal(item)` — `(qty × unitPrice) × (1 - discountPct/100)`, rounded to 2 d.p.
- `calculateTotals(lineItems, globalDiscountPct, vatRate)` — subtotal, discount, VAT, total; filters `is_included = true` items only
- `formatCurrency(amount, currency)` — uses `Intl.NumberFormat`; falls back to `${currency} X.XX` on error

Totals are computed client-side and written to the offer document to support sorting and dashboard aggregation without re-computing on read.

---

## Cross-module events

| Event | Emitted by | Payload | Intended listener |
|---|---|---|---|
| `OFFER_WON` | `OfferBuilderPage` on `won` transition | `{ offerId, offerNumber, clientName, totalValue }` | CMS module (Phase 3) — auto-creates contract draft |

---

## Firestore collections

| Collection / Subcollection | Description |
|---|---|
| `offers` | One document per offer; embeds `sections[]` and `line_items[]` |
| `offers/{id}/workflow_log` | Immutable audit trail entries; create-only |
| `offers/{id}/notes` | Internal notes; create + update allowed (pin toggle) |
| `offer_templates` | Template documents with section type lists |
| `appSettings/offerCounter` | Atomic sequence counter for offer numbering |

---

## Feedback pattern

The Offers module does not use `ToastProvider` (Finance-only). It uses an inline toast state:

```typescript
const [toast, setToast] = useState<string | null>(null);
function showToast(msg: string) {
  setToast(msg);
  setTimeout(() => setToast(null), 3000);
}
```

Do not add `alert()` calls.

---

## Known gaps (Phase 1+)

- No PDF export / preview portal (Phase 2)
- No version history (Phase 3)
- Status labels hardcoded in types (not settings-driven like CMS contract statuses)
- `WorkflowLogEntry` has no `assignee` field yet (Phase 1 parity with `WorkflowEvent` in CMS)
- System note (addNote) after transition is not batched with addWorkflowLogEntry (Phase 1)
- `expired` status has no inbound transition — requires a scheduled function
- `OFFER_WON` platformBus event emitted but no subscriber registered yet (Phase 3)

See `docs/08-known-issues-and-todos.md` for the full tracker.
