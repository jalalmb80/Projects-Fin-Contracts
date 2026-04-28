# 09 — Offers Module

## Location

`src/modules/offers/`

---

## Purpose

The Offers module generates, manages, and tracks commercial proposals. Supports bilingual content (EN/AR), structured sections, line-item pricing, a workflow state machine with immutable audit trail, internal notes, version history, and PDF export. When an offer is won, a `platformBus` event triggers CMS contract creation.

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
| `addWorkflowLogEntry(offerId, entry, newStatus?, systemNote?, versionSnapshot?)` | Batch: log + status + note + version, all atomic |
| `addNote(offerId, note)` | Write to `offers/{id}/notes` subcollection |
| `updateSections / updateLineItems` | Embedded array mutations |
| Template CRUD | `createTemplate`, `updateTemplate`, `archiveTemplate` |

---

## Per-offer hooks (OfferBuilderPage only)

| Hook | Data | Firestore path |
|---|---|---|
| `useOfferDetail(id)` | `workflowLog[]`, `notes[]` | `offers/{id}/workflow_log`, `offers/{id}/notes` |
| `useOfferVersions(id)` | `versions[]` | `offers/{id}/versions` |

---

## Offer numbering

`generateOfferNumber()` is async — `runTransaction` on `appSettings/offerCounter`.  
Format: `OFF-{year}-{seq 4-padded}` — e.g. `OFF-2026-0001`

---

## Subcollection architecture

| Subcollection | Path | Rules |
|---|---|---|
| workflow_log | `offers/{offerId}/workflow_log/{entryId}` | create only (immutable) |
| notes | `offers/{offerId}/notes/{noteId}` | create + update (pin); no delete |
| versions | `offers/{offerId}/versions/{versionId}` | create only (immutable) |

---

## Version history (Phase 3)

`OfferVersion` is written automatically on each status transition inside `addWorkflowLogEntry`’s `writeBatch` — the same atomic write that updates status, adds the log entry, and writes the system note.

```typescript
interface OfferVersion {
  id:             string;
  version_number: number;   // workflowLog.length + 1 at transition time
  created_at:     string;
  change_summary: string;   // e.g. "Status: Draft → Under Review"
  snapshot:       OfferVersionSnapshot;  // full offer minus subcollection fields
}

type OfferVersionSnapshot = Omit<Offer, 'notes' | 'workflow_log'>;
```

The snapshot captures the pre-transition content state (sections + line_items + metadata). Subcollection fields are excluded to avoid size-doubling.

Versions are displayed in the **History** tab in the right panel of `OfferBuilderPage`. Snapshot restore (Phase 4) is not yet implemented.

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
  reason:      string;
  is_system_generated?: boolean;
  created_at:  string;
}
```

---

## Workflow transition flow (Phase 1)

1. Transition button in `WorkflowPanel` → `onTransitionRequest(toStatus)`
2. `OfferBuilderPage` opens `OfferTransitionModal`
3. Modal collects role + name (required) + reason (required if `REASON_REQUIRED`)
4. `handleTransitionConfirm(entry)` builds `systemNote` + `versionSnapshot` → single atomic `writeBatch`
5. If `toStatus === 'won'` → emits `PLATFORM_EVENTS.OFFER_WON` with `{ offerId, offerNumber, clientId, clientName, totalValue }`
6. `CMSOfferWonHandler` in `CMSLayout` receives the event and opens `CreateContractFromOfferModal`

---

## PDF Preview & Export (Phase 2)

**Files:** `offers/utils/exportPdf.ts`, `offers/components/OfferPreviewPortal.tsx`

- Toolbar buttons in `OfferBuilderPage`: **Preview** (Eye) → modal, **PDF** (FileDown) → direct download
- `mode: 'preview'` — full-screen modal with Download PDF + Print + Close
- `mode: 'download'` — off-screen render, auto-exports then `onClose`
- Section-type rendering: `cover_page`, `pricing_table`, `payment_schedule`, `signature_block` get special treatment; all others render as title + content
- Bilingual: `offer.language` drives `dir`, title field, font stack

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
expired → archived (inbound requires scheduled function)
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
| `TemplatesPage` | `/offers/templates` | — |

---

## Firestore collections

| Collection / Subcollection | Description |
|---|---|
| `offers` | Offer documents; embeds `sections[]` and `line_items[]` |
| `offers/{id}/workflow_log` | Immutable audit trail |
| `offers/{id}/notes` | Internal notes; create + update |
| `offers/{id}/versions` | Immutable content snapshots; one per status transition |
| `offer_templates` | Template documents |
| `appSettings/offerCounter` | Atomic sequence counter |
| `offer_settings/general` | Module config: `workflow_roles[]` |

---

## Cross-module events

| Event | Emitted | Payload | Subscriber |
|---|---|---|---|
| `OFFER_WON` | `OfferBuilderPage` on `won` | `{ offerId, offerNumber, clientId, clientName, totalValue }` | `CMSOfferWonHandler` in `CMSLayout` → `CreateContractFromOfferModal` |

**Limitation:** Modal only appears when CMS module is mounted. Tracked in docs/08 issue #14.

---

## Known gaps (Phase 4+)

- Version snapshot restore UI
- Status labels not settings-driven
- No settings UI page for `offerWorkflowRoles`
- PDF export engine duplicated from CMS (Phase 4 → `src/core/utils/exportPdf.ts`)
- `expired` status needs a scheduled Cloud Function
- OFFER_WON handler should be platform-level (not module-level) for full reliability

See `docs/08-known-issues-and-todos.md` for the full tracker.
