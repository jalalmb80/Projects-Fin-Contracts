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
| clients | `cms_clients` | `name_ar` asc |
| templates | `cms_templates` | `name_ar` asc |
| projects | `cms_projects` | `name_ar` asc |

### Auth guard

The hook checks `user` from `usePlatform()` before opening any listeners. If `user` is null, it sets `loading: false` and returns empty arrays. This prevents Firestore permission errors during the auth loading phase.

### Error handling

Each `onSnapshot` call has an error handler that logs the error code and sets `loading: false`. If a listener fails silently, the page will show empty data rather than a perpetual spinner.

---

## CMS types — important

**File:** `src/modules/cms/types.ts`

All field names use Arabic naming conventions matching the original standalone contracts app. **Always check this file before writing form fields.**

Key interfaces:

```typescript
interface Client {
  id: string;
  name_ar: string;
  entity_type: 'شركة' | 'جمعية' | 'جهة حكومية' | 'فرد';
  license_authority: string;
  license_no: string;
  representative_name: string;
  representative_title: string;
  national_id: string;
  address: string; city: string; postal_code: string;
  phone: string; email: string;
}

interface Project {
  id: string;
  name_ar: string;
  project_type: ProjectType;  // Arabic string literal union
  client_id: string;
  amount_sar: number;
  status: ProjectStatus;      // Arabic string literal union
  description?: string;
  start_date?: string;
}

type ProjectStatus = 'مخطط' | 'قيد التنفيذ' | 'مكتمل' | 'معلّق';

type ProjectType = 'تطوير منصة' | 'تطوير تطبيق' | 'موقع إلكتروني'
                 | 'اشتراك سنوي' | 'تهيئة وتشغيل' | 'استشارات' | 'أخرى';
```

The `Contract` type is large (articles, appendices, payment schedule, versions). See the file for full definition.

---

## Pages

| Page | Route | Purpose |
|---|---|---|
| `CMSDashboardPage` | `/cms` | Stats overview, recent contracts |
| `ContractsPage` | `/cms/contracts` | Contract list + editor |
| `CMSClientsPage` | `/cms/clients` | Client CRUD |
| `CMSProjectsPage` | `/cms/projects` | CMS project CRUD |
| `TemplatesPage` | `/cms/templates` | Contract template CRUD |
| `CMSSettingsPage` | `/cms/settings` | Company name, logo, signature |

---

## ContractEditor — the core component

**File:** `src/modules/cms/components/ContractEditor.tsx`

The contract editor is a large (~1,400 line) component with tabbed sections:
- **Metadata** — contract number, type, status, client, project, dates
- **Articles** — structured article editor (paragraph, list, page break blocks)
- **Payment schedule** — task rows, installment table, totals, VAT
- **Appendices** — free-form appendix editor
- **Preview** — rendered contract preview with Hijri date support

When the contract status is changed to `'موقّع'` (Signed), the editor emits a `CONTRACT_SIGNED` event on `platformBus` with the contract's financial data. The Finance module's `BillingFormPage` listens for this event.

---

## PDF export

**File:** `src/modules/cms/utils/exportPdf.ts`

Uses `html2pdf.js` to export the contract preview rendered in `ContractEditor`. The preview renders full Arabic RTL layout with company logo, Hijri date, articles, payment schedule table, and signature block.

---

## Feedback pattern

CMS pages do not have access to `ToastProvider` (it is scoped to the Finance module). They use an inline feedback state instead:

```typescript
const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

const showFeedback = (type, msg) => {
  setFeedback({ type, msg });
  setTimeout(() => setFeedback(null), 4000);
};
```

This renders a dismissing banner below the page heading. Do not add `alert()` calls.

---

## CMS vs Finance data separation

The CMS module has its own separate Firestore collections (`cms_clients`, `cms_projects`, `cms_contracts`, `cms_templates`, `cms_settings`). These are entirely separate from the Finance collections (`counterparties`, `projects`, etc.).

A CMS client is not the same as a Finance counterparty. A CMS project is not the same as a Finance project. They happen to represent similar real-world concepts but they have different data structures and lifecycles.
