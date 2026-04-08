# 05 — Firebase & Security

## Firebase project setup

The app uses a single Firebase project for:
- **Firebase Authentication** — email/password sign-in
- **Cloud Firestore** — all persistent data

Configuration is read from environment variables. Copy `.env.example` to `.env.local` and fill in the values from your Firebase Console.

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GOOGLE_CLIENT_ID       # for optional Google Drive integration
```

---

## Firebase initialization

**File:** `src/core/firebase.ts`

Singleton pattern — calls `getApps().length ? getApp() : initializeApp(config)` to avoid re-initialization in development with HMR.

Exports: `db` (Firestore), `auth` (Firebase Auth), `app` (default).

---

## Firestore collections

### Finance collections

| Collection | Description | Key fields |
|---|---|---|
| `projects` | Finance projects | `id, name, clientId, contractValue, status, milestones[], wbs[]` |
| `billingDocuments` | Invoices and credit notes | `id, type, direction, status, counterpartyId, lines[], total, balance` |
| `payments` | Payment records | `id, amount, counterpartyId, direction, allocations[]` |
| `subscriptions` | Recurring billing | `id, counterpartyId, billingCycle, nextInvoiceDate, items[]` |
| `counterparties` | Customers/vendors | `id, name, type, currency, paymentTermsDays` |
| `products` | Product catalog | `id, name, defaultPrices{SAR,USD}, defaultTaxCode` |
| `legalEntities` | Company entities | `id, name, taxId, address, currency` |
| `budgetCategories` | WBS budget categories | `id, name, projectId, planned, actual` |
| `transactions` | Audit ledger | `id, date, amount, type, referenceId` |
| `appSettings/config` | App configuration | `sarToUsdRate, invoicePrefix, defaultCurrency, ...` |
| `appSettings/invoiceCounter` | Atomic invoice counter | `lastSequence: number` |

### CMS collections

| Collection | Description | Key fields |
|---|---|---|
| `cms_contracts` | Legal contracts | `id, title_ar, status, client_id, articles[], payment_schedule` |
| `cms_clients` | CMS clients | `id, name_ar, entity_type, representative_name, license_no` |
| `cms_templates` | Contract templates | `id, name_ar, category, default_articles[]` |
| `cms_projects` | CMS projects | `id, name_ar, project_type, client_id, amount_sar, status` |
| `cms_settings/general` | CMS branding | `companyName, logoUrl, signatureText, signatureImageUrl` |

---

## Firestore security rules

**File:** `firestore.rules`

All rules follow one simple principle: **authenticated users have full read/write access to all business collections. Everything else is denied.**

This is appropriate for an internal single-tenant app where all users are trusted employees. If multi-tenancy or role-based access control is added in the future, the rules will need to be extended.

Current rule summary:
```
✅ Authenticated → full access to all Finance collections
✅ Authenticated → full access to all CMS collections  
✅ Authenticated → full access to appSettings (including write)
❌ Unauthenticated → denied everything
❌ Any other collection → denied
```

---

## Authentication flow

1. User visits any route → `AppShell` checks `loadingAuth`
2. While `loadingAuth` is true → loading spinner shown
3. If `user` is null → redirect to `/login`
4. User submits email/password → `signInWithEmailAndPassword()`
5. On success → Firebase sets auth state → `onAuthStateChanged` fires → `PlatformContext` sets `user` → `AppShell` re-renders with full app
6. On logout → `signOut()` → `user` becomes null → redirect to `/login`

Auth is only handled at the shell level. Individual modules and pages do not check auth — the shell guarantees that any rendered module is authenticated.

---

## Invoice number safety

Invoice numbers are generated using a Firestore `runTransaction` on `appSettings/invoiceCounter`. The transaction atomically reads `lastSequence`, increments it, and writes it back before returning the new value. This prevents duplicate invoice numbers even under concurrent users.

Format: `{invoicePrefix}{year}-{sequence padded to 4 digits}` e.g. `INV-2026-0001`

---

## Google Drive integration

**File:** `src/modules/cms/services/googleDrive.ts`

Optional. Allows uploading contract attachments directly to Google Drive. Requires `VITE_GOOGLE_CLIENT_ID` in `.env.local` and the Google Identity Services script loaded in `index.html`. Not fully wired into the UI as of the current version — the service exists but upload triggers are not connected to contract attachment saving.
