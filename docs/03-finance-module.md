# 03 — Finance Module

## Location

`src/modules/finance/`

## Entry point

`src/modules/finance/routes.tsx` — defines the provider tree and all routes.

---

## AppContext — the brain of Finance

**File:** `src/modules/finance/context/AppContext.tsx`

This is the most important file in the Finance module. Read it before touching any Finance page.

### What it manages

| Collection | Firestore path | Sync type |
|---|---|---|
| projects | `projects` | real-time onSnapshot |
| billingDocuments | `billingDocuments` | real-time onSnapshot |
| payments | `payments` | real-time onSnapshot |
| subscriptions | `subscriptions` | real-time onSnapshot |
| counterparties | `counterparties` | real-time onSnapshot |
| products | `products` | one-time getDocs |
| legalEntities | `legalEntities` | one-time getDocs |
| budgetCategories | `budgetCategories` | one-time getDocs |
| settings | `appSettings/config` | one-time getDoc |

### Key behaviors

- All CRUD operations fire `addToast()` on success and error — no silent failures.
- `issueDocument()` uses `runTransaction` to atomically increment an invoice counter at `appSettings/invoiceCounter`, preventing duplicate invoice numbers under concurrent use.
- `completeMilestone()` uses `writeBatch` to atomically update the milestone status and create an invoice draft in a single write.
- `runBillingJob()` scans all active subscriptions due today, generates invoice drafts, and advances their `nextInvoiceDate`.
- `allocatePayment()` uses `writeBatch` to update both the payment and the invoice in one atomic write.

### State shape

```typescript
interface AppState {
  user: User | null;
  projects: Project[];
  billingDocuments: BillingDocument[];
  payments: Payment[];
  subscriptions: Subscription[];
  counterparties: Counterparty[];
  products: Product[];
  legalEntities: LegalEntity[];
  budgetCategories: BudgetCategory[];
  settings: AppSettings;
  displayCurrency: Currency;        // SAR or USD — toggleable in header
  loading: { [collection]: boolean };
  error: string | null;
}
```

---

## Pages

| Page | Route | Purpose |
|---|---|---|
| `DashboardPage` | `/finance/dashboard` | KPI overview |
| `ProjectListPage` | `/finance/projects` | All projects table |
| `ProjectDetailPage` | `/finance/projects/:id` | Project detail, WBS, milestones |
| `BillingListPage` | `/finance/billing` | All invoices/credit notes with filters |
| `BillingDetailPage` | `/finance/billing/:id` | Invoice detail, payment recording |
| `BillingFormPage` | `/finance/billing/new` | New invoice/credit note form |
| `SubscriptionListPage` | `/finance/subscriptions` | All subscriptions + billing job trigger |
| `SubscriptionDetailPage` | `/finance/subscriptions/:id` | Subscription detail |
| `SubscriptionFormPage` | `/finance/subscriptions/new` | New subscription form |
| `PaymentsPage` | `/finance/payments` | Payments list |
| `CounterpartiesPage` | `/finance/counterparties` | Counterparty CRUD |
| `ProductsPage` | `/finance/products` | Product catalog |
| `SettingsPage` | `/finance/settings` | Legal entities, currency, WBS categories |
| `LoginPage` | `/login` | Auth (shared, lives in `core/pages/`) |

---

## Types

**File:** `src/modules/finance/types.ts`

All business types are defined here. Key enums:

- `Currency` — `USD | SAR`
- `DocumentStatus` — `Draft | PendingApproval | Approved | Issued | Sent | PartiallyPaid | Paid | Overdue | Void`
- `DocumentDirection` — `AR | AP | IC` (Accounts Receivable / Accounts Payable / Intercompany)
- `SubscriptionStatus` — `Draft | Active | Suspended | Cancelled | Expired`
- `ProjectStatus` — `Planned | Active | OnHold | Completed | Cancelled`
- `MilestoneStatus` — `Pending | InProgress | Completed | Invoiced`
- `CounterpartyType` — `CUSTOMER | VENDOR | BOTH | INTERCOMPANY`
- `TaxProfile` — `Standard | Export | Intercompany`

Note: Finance types use English enum values. CMS types use Arabic string literals. Do not mix them.

---

## Toast notifications

The Finance module uses `ToastProvider` / `useToast()` from `src/modules/finance/components/ui/Toast.tsx`.

- `AppContext` calls `addToast()` internally after every CRUD operation.
- Three Finance pages also call `useToast()` directly for page-level validation: `SubscriptionListPage`, `ProductsPage`, `ProjectDetailPage`, `BillingDetailPage`.
- Do not use `alert()` anywhere in Finance.

---

## Forms architecture

All forms (`InvoiceForm`, `ProjectForm`, `SubscriptionForm`, `CounterpartyForm`) get their data from `useApp()` — they do not fetch from Firestore directly. This ensures the dropdown lists (counterparties, projects, legal entities) are always in sync with the rest of the UI without an extra network call.

---

## Currency display

`AppContext` exposes `displayCurrency` and `setDisplayCurrency`. The header's currency toggle button switches between SAR and USD. The `formatMoney(amount, fromCurrency)` helper converts and formats any amount to the currently selected display currency using the rates in `settings`.
