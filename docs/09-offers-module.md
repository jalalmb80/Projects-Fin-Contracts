# 09 — Offers Module

## Location

`src/modules/offers/`

## Entry point

`src/modules/offers/routes.tsx`

---

## Purpose

The Offers module generates, manages, and tracks commercial proposals sent to clients. It supports bilingual content (EN / AR), structured sections, line-item pricing, a workflow state machine with an immutable audit trail, internal notes, and PDF export. Offers are the pre-sales counterpart to CMS Contracts — when an offer is won a `platformBus` event fires so the CMS module can create the corresponding contract.

---

## Provider architecture

Two providers wrap `OffersLayout`. Both mount once; all child pages consume via hooks.

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
| `createOffer(offer, initialWorkflowEntry)` | Batch: offer doc + first workflow_log entry, atomic |
| `updateOffer(id, data)` | Partial offer update |
| `addWorkflowLogEntry(offerId, entry, newStatus?, systemNote?)` | Batch: log entry + status + optional note — atomic |
| `addNote(offerId, note)` | Write to `offers/{id}/notes` |
| `updateSections / updateLineItems` | Embedded array mutations |
| Template CRUD | `createTemplate`, `updateTemplate`, `archiveTemplate` |

### useOffersSettings — key values

| Value | Description |
|---|---|
| `offerWorkflowRoles: string[]` | From `offer_settings/general`; defaults to `DEFAULT_OFFER_WORKFLOW_ROLES` |
| `updateOfferWorkflowRoles(roles)` | Persists to Firestore + updates local state |

---

## useOfferDetail hook

**File:** `src/modules/offers/hooks/useOfferDetail.ts`

Used exclusively in `OfferBuilderPage`. Subscribes to per-offer subcollections.

| Subcollection | Path | Order |
|---|---|---|
| workflow_log | `offers/{id}/workflow_log` | `created_at` desc |
| notes | `offers/{id}/notes` | `created_at` desc |

---

## Offer numbering

`generateOfferNumber()` is async — uses `runTransaction` on `appSettings/offerCounter`.  
Format: `OFF-{year}-{seq padded 4}` — e.g. `OFF-2026-0001`

---

## Subcollection architecture

| Subcollection | Path | Rules |
|---|---|---|
| workflow_log | `offers/{offerId}/workflow_log/{entryId}` | create only (immutable) |
| notes | `offers/{offerId}/notes/{noteId}` | create + update (pin); no delete |

---

## WorkflowLogEntry shape (Phase 1+)

```typescript
interface WorkflowLogEntry {
  id:          string;
  type:        'transition' | 'note';
  actor_name:  string;
  actor_email: string;
  assignee:    { role: string; name: string };
  from_status: OfferStatus | null;
  to_status:   OfferStatus;
  reason:      string;   // transition reason OR note body
  is_system_generated?: boolean;
  created_at:  string;
}
```

---

## Workflow flow (Phase 1)

1. Transition button in `WorkflowPanel` → `onTransitionRequest(toStatus)`
2. `OfferBuilderPage` opens `OfferTransitionModal`
3. Modal collects role + name (required) + reason (required if `REASON_REQUIRED`)
4. `handleTransitionConfirm(entry)` → builds `systemNote` → calls `addWorkflowLogEntry(offerId, entry, toStatus, systemNote)` — **one atomic writeBatch**
5. If `toStatus === 'won'` → emits `PLATFORM_EVENTS.OFFER_WON`

Note flow: "Add Note" button → `OfferNoteModal` → `addWorkflowLogEntry(offerId, entry)` (workflow-log only, no status change).

---

## PDF Preview & Export (Phase 2)

### exportOfferToPdf

**File:** `src/modules/offers/utils/exportPdf.ts`

Pipeline: clone element → resolve oklch colors → html2canvas (scale 2) → slice into A4 pages → jsPDF → download.

```typescript
await exportOfferToPdf(elementId, { filename: 'OFF-2026-0001-proposal.pdf' });
const blob = await generateOfferPdfBlob(elementId);  // for upload
```

### OfferPreviewPortal

**File:** `src/modules/offers/components/OfferPreviewPortal.tsx`

```typescript
<OfferPreviewPortal
  offer={offer}
  mode="preview"    // 'preview' | 'download'
  onClose={() => setPreviewMode(null)}
/>
```

**Modes:**
- `preview` — full-screen modal; toolbar: Download PDF + Print + Close
- `download` — off-screen render; auto-exports after 2 rAF + 300 ms; calls `onClose`

**Section-type-aware rendering:**

| Section type | Rendered as |
|---|---|
| `cover_page` | Styled metadata header (number, client, expiry, status) |
| `pricing_table` | Live `offer.line_items` table with subtotal / discount / VAT / total |
| `payment_schedule` | Three KPI cards + section content |
| `signature_block` | Two-column signature area (Supplier / Client) |
| All others | `<h2>` title + `dangerouslySetInnerHTML` content |

**Bilingual:** `offer.language` drives `dir`, section title field, font stack, and all body strings.

**Automatic header:** Shown when no `cover_page` section exists.

### Trigger points in OfferBuilderPage

- **Preview button** (Eye icon, top bar) → `setPreviewMode('preview')`
- **PDF button** (FileDown icon, top bar) → `setPreviewMode('download')` → auto-exports

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
expired → archived
archived → (terminal)
```

`REASON_REQUIRED = ['revised', 'lost']`

---

## Pages

| Page | Route | Purpose |
|---|---|---|
| `OffersDashboardPage` | `/offers` | KPI cards, status breakdown, recent offers |
| `OffersListPage` | `/offers/list` | List + filters + search + New Offer modal |
| `OfferBuilderPage` | `/offers/builder/:id` | Three-panel editor + workflow/notes + preview |
| `TemplatesPage` | `/offers/templates` | Template CRUD |

---

## Firestore collections

| Collection / Subcollection | Description |
|---|---|
| `offers` | Offer documents; embeds `sections[]` and `line_items[]` |
| `offers/{id}/workflow_log` | Immutable audit trail; create-only |
| `offers/{id}/notes` | Internal notes; create + update |
| `offer_templates` | Template documents |
| `appSettings/offerCounter` | Atomic sequence counter |
| `offer_settings/general` | Module config: `workflow_roles[]` (Phase 1+) |

---

## Feedback pattern

Inline toast state — no `ToastProvider` dependency. Do not add `alert()` calls.

---

## Cross-module events

| Event | Emitted | Subscriber |
|---|---|---|
| `OFFER_WON` | `OfferBuilderPage` on `won` | Phase 3 — CMS listener auto-creates contract draft |

---

## Known gaps (Phase 3+)

- Version history (`OfferVersion` snapshots on save)
- OFFER_WON subscriber in CMS → CreateContractFromOfferModal
- Status labels not settings-driven (hardcoded in types.ts)
- No settings UI for editing `offerWorkflowRoles`
- `expired` status needs a scheduled Cloud Function
- PDF export engine duplicated from CMS (Phase 4 → extract to `src/core/utils/exportPdf.ts`)

See `docs/08-known-issues-and-todos.md` for the full tracker.
