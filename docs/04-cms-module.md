# 04 — CMS Module (Contract Management System)

## Location

`src/modules/cms/`

## Entry point

`src/modules/cms/routes.tsx`

---

## Purpose

The CMS module generates, manages, and exports formal Arabic legal contracts. It is completely Arabic-first: all data fields, type values, and form labels use Arabic. The module is RTL-oriented (`dir="rtl"` on the layout container).

---

## useContracts hook — the data layer

**File:** `src/modules/cms/hooks/useContracts.ts`

This hook is the equivalent of `AppContext` for the CMS. Every CMS page that needs data calls this hook.

### What it manages

| Collection | Firestore path | Order |
|---|---|---|
| contracts | `cms_contracts` | `start_date` desc |
| clients | `shared_clients` (via `useSharedClients`) | `name_ar` asc |
| templates | `cms_templates` | `name_ar` asc |
| projects | `cms_projects` | `name_ar` asc |

### Key methods

| Method | Purpose |
|---|---|
| `addContract` / `updateContract` / `deleteContract` | Standard contract CRUD |
| `addWorkflowEvent(contractId, event, newStatus?)` | Atomic write: prepends event to `workflow_events[]`, optionally updates `status` in one `updateDoc` call |
| `addClient` / `updateClient` / `deleteClient` | Proxied through `useSharedClients` |
| `addTemplate` / `updateTemplate` / `deleteTemplate` | Template CRUD |
| `addProject` / `updateProject` / `deleteProject` | Project CRUD |

### Auth guard

The hook checks `user` from `usePlatform()` before opening any listeners. If `user` is null, it sets `loading: false` and returns empty arrays.

---

## CMS types — important

**File:** `src/modules/cms/types.ts`

All field names use Arabic naming conventions. **Always check this file before writing form fields.**

### Workflow types (added 2026-04-19)

```typescript
interface WorkflowAssignee {
  role: string;   // from workflow_roles list, or free text if 'أخرى'
  name: string;   // person's name, always free text
}

interface WorkflowEvent {
  id: string;
  type: 'transition' | 'note';
  from_status: string | null;   // null reserved for future use
  to_status: string;            // same as from_status when type === 'note'
  assignee: WorkflowAssignee;
  note: string;                 // required for 'note', optional for 'transition'
  actor_name: string;           // Firebase user displayName ?? email prefix
  actor_email: string;
  created_at: string;           // ISO timestamp
}
```

`Contract` has a new optional field:
```typescript
workflow_events?: WorkflowEvent[]; // absent on pre-workflow contracts — always read as ?? []
```

`AppSettings` has a new field:
```typescript
workflow_roles: string[]; // configurable list, persisted to cms_settings/config
```

Default roles: `مدير العقود | فريق القانوني | مدير المبيعات | فريق التنفيذ | الإدارة العليا | أخرى`

---

## Pages

| Page | Route | Purpose |
|---|---|---|
| `CMSDashboardPage` | `/cms` | Stats overview, recent contracts |
| `ContractsPage` | `/cms/contracts` | Contract list + editor |
| `CMSClientsPage` | `/cms/clients` | Client CRUD |
| `CMSProjectsPage` | `/cms/projects` | CMS project CRUD |
| `TemplatesPage` | `/cms/templates` | Contract template CRUD |
| `CMSSettingsPage` | `/cms/settings` | Statuses, types, **workflow roles** |

---

## ContractEditor — the core component

**File:** `src/modules/cms/components/ContractEditor.tsx`

Tabbed sections:
- **معلومات العقد** — contract number, type, **status (workflow-tracked)**, client, project, dates
- **البنود** — structured article editor
- **المدفوعات** — task rows, installment table, totals, VAT
- **الملاحق** — appendix editor
- **المرفقات** — attachment list
- **الإصدارات** — version history
- **سجل الإجراءات** — workflow timeline (new)
- **معاينة العقد** — contract preview + PDF/Drive export

### Status change flow

Changing the status select in the Metadata tab calls `handleStatusChangeRequest()` instead of directly updating state. This opens `WorkflowTransitionModal`. On confirm, `addWorkflowEvent()` is called atomically (status + event in one write). Win-status side effects (Finance modal + platformBus event) fire after the workflow event is confirmed.

### Versioning

Versions are created on contract **content** save only. Status changes via workflow do **not** create version snapshots. The diff comparison excludes `workflow_events` from the change check.

---

## Workflow components

| Component | File | Purpose |
|---|---|---|
| `WorkflowTransitionModal` | `components/WorkflowTransitionModal.tsx` | Status-change dialog: assignee (role+name) + optional note. Pure UI — no Firestore |
| `WorkflowNoteModal` | `components/WorkflowNoteModal.tsx` | Note-only dialog: same assignee fields + required note. Pure UI |
| `WorkflowTimeline` | `components/WorkflowTimeline.tsx` | Timeline tab: current-status banner, action buttons, event cards (newest first) |

### WorkflowTransitionModal

- Props: `contractId`, `fromStatus`, `toStatus`, `onConfirm(event: WorkflowEvent)`, `onCancel`
- Validates: assignee name is required
- Selecting role `أخرى` converts the dropdown to a free-text input
- Renders via `createPortal` into `document.body`

### WorkflowNoteModal

- Props: `currentStatus`, `onConfirm(event: WorkflowEvent)`, `onCancel`
- Note text is **required** (unlike transition where it is optional)
- Produces a `WorkflowEvent` with `type: 'note'` and `from_status === to_status`

### WorkflowTimeline

- Shows current status banner with latest assignee
- "إضافة ملاحظة" button opens `WorkflowNoteModal` via parent callback
- "تغيير الحالة" button navigates to Metadata tab (status select is there)
- Events displayed newest-first; transitions use 🔄 icon, notes use 📝 icon
- Win-status transitions show emerald card; notes show blue card

---

## PDF export

**File:** `src/modules/cms/utils/exportPdf.ts`

Uses `html2pdf.js`. The preview renders full Arabic RTL layout with company logo, Hijri date, articles, payment schedule table, and signature block.

---

## Feedback pattern

CMS pages do not have access to `ToastProvider`. They use an inline feedback state:

```typescript
const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
```

Do not add `alert()` calls.

---

## CMS vs Finance data separation

The CMS module has its own Firestore collections (`cms_contracts`, `cms_templates`, `cms_projects`, `cms_settings`). Clients are now shared via `shared_clients` (accessible from both Finance and CMS). A CMS project is still separate from a Finance project.
