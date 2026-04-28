# 09 — Offers Module

## Location

`src/modules/offers/`

## Entry point

`src/modules/offers/routes.tsx`

---

## Purpose

The Offers module generates, manages, and tracks commercial proposals sent to clients. It supports bilingual content (EN / AR), structured sections, line-item pricing, a workflow state machine, an immutable audit trail, and internal notes. Offers are the pre-sales counterpart to CMS Contracts — when an offer is won, a platformBus event fires so the CMS module can create the corresponding contract.

---

## Provider architecture

Two providers wrap `OffersLayout`. Both are mounted once; all child pages consume via hooks.

```
OffersProvider          (Firestore listeners: offers + offer_templates)
  OffersSettingsProvider  (getDoc: offer_settings/general)
    OffersLayoutInner     (sidebar + Outlet)
```

| Provider | Hook | Source |
|---|---|---|
| `OffersProvider` | `useOffersContext()` | `offers` + `offer_templates` onSnapshot |
| `OffersSettingsProvider` | `useOffersSettings()` | `offer_settings/general` getDoc |

### useOffersContext — what it exposes

| Method | Purpose |
|---|---|
| `createOffer(offer, initialWorkflowEntry)` | Batch: offer doc + first workflow_log entry, atomic |
| `updateOffer(id, data)` | Partial update on the offer document |
| `addWorkflowLogEntry(offerId, entry, newStatus?, systemNote?)` | Batch: subcollection entry + status + optional note — atomic |
| `addNote(offerId, note)` | Standalone write to `offers/{id}/notes` |
| `updateSections(offerId, sections)` | Replace embedded sections array |
| `updateLineItems(offerId, items, discountPct, vatRate)` | Replace line items + recalculate totals |
| Template CRUD | `createTemplate`, `updateTemplate`, `archiveTemplate` |

### useOffersSettings — what it exposes

| Value | Type | Description |
|---|---|---|
| `offerWorkflowRoles` | `string[]` | Loaded from `offer_settings/general.workflow_roles`; defaults to `DEFAULT_OFFER_WORKFLOW_ROLES` |
| `updateOfferWorkflowRoles(roles)` | `Promise<void>` | Persists to Firestore + updates local state |
| `offerSettingsLoading` | `boolean` | True until initial getDoc resolves |

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

`generateOfferNumber()` is **async**. Uses `runTransaction` on `appSettings/offerCounter`. Collision-safe.

Format: `OFF-{year}-{sequence padded to 4 digits}` — e.g. `OFF-2026-0001`

---

## Subcollection architecture

As of Phase 0 (2026-04-28), `workflow_log` and `notes` are Firestore subcollections.

| Subcollection | Path | Rules |
|---|---|---|
| workflow_log | `offers/{offerId}/workflow_log/{entryId}` | create only (immutable) |
| notes | `offers/{offerId}/notes/{noteId}` | create + update (pin toggle); no delete |

---

## Workflow audit trail — WorkflowLogEntry shape (Phase 1+)

```typescript
interface WorkflowLogEntry {
  id:          string;
  type:        'transition' | 'note';   // Added Phase 1
  actor_name:  string;
  actor_email: string;
  assignee: {                            // Added Phase 1
    role: string;   // from offerWorkflowRoles
    name: string;   // required, entered by user
  };
  from_status: OfferStatus | null;
  to_status:   OfferStatus;
  reason:      string;   // transition reason OR note body
  is_system_generated?: boolean;
  created_at:  string;
}
```

Pre-Phase-1 entries (missing `type` and `assignee`) are handled with optional chaining in WorkflowPanel.

---

## Workflow transition flow (Phase 1)

1. User sees available transitions as buttons in `WorkflowPanel`
2. Clicking a button calls `onTransitionRequest(toStatus)` → `OfferBuilderPage` opens `OfferTransitionModal`
3. Modal collects: role (from `offerWorkflowRoles`), name (required), reason (required if `REASON_REQUIRED`)
4. On confirm → `handleTransitionConfirm(entry: WorkflowLogEntry)`:
   - Builds `systemNote: OfferNote` (body = status change summary)
   - Calls `addWorkflowLogEntry(offerId, entry, toStatus, systemNote)` — **one atomic writeBatch**
   - Emits `PLATFORM_EVENTS.OFFER_WON` if `toStatus === 'won'`

## Note flow (Phase 1)

1. User clicks "Add Note" in `WorkflowPanel` → `OfferBuilderPage` opens `OfferNoteModal`
2. Modal collects: role, name (required), note body (required)
3. On confirm → `handleNoteConfirm(entry: WorkflowLogEntry)`:
   - Calls `addWorkflowLogEntry(offerId, entry)` — writes to workflow_log only, no status change

**Panel separation:**
- `WorkflowPanel` shows the full audit trail (transitions + notes, type-differentiated)
- `NotesPanel` shows user-initiated sticky notes / comments (separate `offers/{id}/notes` subcollection)

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

**Note:** `expired` has no inbound UI transitions — intended for a scheduled Cloud Function.

---

## Pages

| Page | Route | Purpose |
|---|---|---|
| `OffersDashboardPage` | `/offers` | KPI cards, status breakdown, recent offers |
| `OffersListPage` | `/offers/list` | List with status filters, search, New Offer modal |
| `OfferBuilderPage` | `/offers/builder/:id` | Three-panel editor + workflow/notes sidebar |
| `TemplatesPage` | `/offers/templates` | Template CRUD |

---

## OfferBuilderPage — three-panel layout

- **Left** — `SectionNavigator`: section list, move/remove/add controls
- **Center** — `SectionEditor`: content editor; routes to `PricingSection` for `pricing_table` type
- **Right** — tabbed: `WorkflowPanel` (audit trail + actions) / `NotesPanel` (sticky notes)

### Read-only mode

Statuses `approved`, `sent_to_client`, `won`, `lost`, `archived` → `readOnly = true`. Content editor disabled; WorkflowPanel still shows available transitions (e.g. `won → archived`). Clicking a transition button while `readOnly` is guarded in `onTransitionRequest`.

---

## Configurable workflow roles

**Source:** `offer_settings/general.workflow_roles` (Firestore)  
**Default:** `DEFAULT_OFFER_WORKFLOW_ROLES` from `types.ts`  
**Consumed by:** `OfferTransitionModal`, `OfferNoteModal`

A settings UI page for editing roles will be added in a future phase (matching the CMS "أدوار سير العمل" settings section).

---

## Pricing

- `calculateLineTotal(item)` — `(qty × unitPrice) × (1 - discountPct/100)`, 2 d.p.
- `calculateTotals(lineItems, globalDiscountPct, vatRate)` — subtotal, discount, VAT, total
- `formatCurrency(amount, currency)` — `Intl.NumberFormat`

Totals written to offer document for dashboard aggregation.

---

## Feedback pattern

Offers module uses inline toast state — no `ToastProvider` dependency:

```typescript
const [toast, setToast] = useState<string | null>(null);
function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }
```

Do not add `alert()` calls.

---

## Cross-module events

| Event | Emitted | Payload | Subscriber |
|---|---|---|---|
| `OFFER_WON` | `OfferBuilderPage` on `won` transition | `{ offerId, offerNumber, clientName, totalValue }` | Phase 3 — CMS listener auto-creates contract draft |

---

## Firestore collections

| Collection / Subcollection | Description |
|---|---|
| `offers` | Offer documents; embeds `sections[]` and `line_items[]` |
| `offers/{id}/workflow_log` | Immutable audit trail; create-only |
| `offers/{id}/notes` | Internal notes; create + update (pin) |
| `offer_templates` | Template documents |
| `appSettings/offerCounter` | Atomic offer number sequence |
| `offer_settings/general` | Module config: `workflow_roles[]` (Phase 1+) |

---

## Known gaps (Phase 2+)

- No PDF export / preview portal
- No version history (OfferVersion snapshots)
- Status labels hardcoded (not settings-driven like CMS contract_statuses)
- No settings UI page for editing `offerWorkflowRoles`
- `expired` status has no inbound transition (needs scheduled function)
- `OFFER_WON` event has no subscriber yet (Phase 3)

See `docs/08-known-issues-and-todos.md` for the full tracker.
