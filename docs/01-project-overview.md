# 01 — Project Overview

## What is this?

A private, internal business management platform for a Saudi technology company. It combines two separate operational systems into one web app:

- **Finance module** — tracks projects, invoices, subscriptions, payments, counterparties, and products. Used by finance and operations staff.
- **CMS module** (Contract Management System) — creates, manages, and exports Arabic-language legal contracts. Used by the contracts and legal team.

The app is Arabic-supporting (RTL layout in CMS, bilingual labels throughout) and uses Saudi Riyal (SAR) as the primary currency alongside USD.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| Backend / DB | Firebase Firestore (NoSQL, real-time) |
| Auth | Firebase Authentication (email/password) |
| Icons | Lucide React |
| Charts | Recharts |
| PDF export | html2pdf.js + jsPDF |
| Animation | Motion (Framer Motion v12) |
| Date utilities | date-fns |
| Google Drive | Google Drive API v3 (optional integration) |

---

## Origin

This project was merged from two separate standalone apps:

- **FinArchiTec2.1** — the Finance module, a fully Firebase-backed app with routing, auth, and real-time data.
- **contracts-main** — the CMS module, originally a pure in-memory React app with mock data.

The merge work introduced a shared platform shell (`AppShell`, `PlatformContext`, `ModuleSwitcher`) and wired both modules into a single deployable app. The CMS was connected to Firebase Firestore as part of this work.

See [06-change-history.md](./06-change-history.md) for the full timeline.

---

## What the app does — feature list

### Finance module
- **Dashboard** — KPI cards (revenue, overdue invoices, open projects)
- **Projects** — project tracking with WBS (Work Breakdown Structure), milestones, and contract values
- **Billing** — full AR/AP invoice lifecycle: Draft → Pending Approval → Approved → Issued → Sent → Paid/Overdue/Void
- **Subscriptions** — recurring billing management (monthly/quarterly/yearly) with auto-billing job
- **Payments** — payment recording and allocation against invoices
- **Counterparties** — customers, vendors, intercompany entities
- **Products** — product catalog with pricing in SAR/USD
- **Settings** — legal entities, currency rates, WBS categories, invoice prefix

### CMS module
- **Contracts** — create and edit Arabic legal contracts with structured articles, appendices, and payment schedules
- **Clients** — CMS-specific client registry (separate from Finance counterparties)
- **Projects** — CMS-specific project list (separate from Finance projects)
- **Templates** — reusable contract templates by category
- **Settings** — company branding (logo, signature) stored in Firestore
- **PDF export** — generate formatted Arabic contract PDFs

### Cross-module integration
- When a contract is marked as **Signed** in the CMS, a `CONTRACT_SIGNED` event fires on `platformBus`. The Finance `BillingFormPage` listens for this event and auto-populates a new invoice draft with the contract's counterparty, project, and amount.

---

## Supported currencies

`SAR` (Saudi Riyal) and `USD` (US Dollar). Conversion rates are configurable in Finance Settings. The currency toggle in the Finance header switches the display currency for all monetary values in real time.

---

## Authentication

Email/password via Firebase Authentication. One login for both modules. Auth state is managed in `PlatformContext` at the shell level — both modules inherit the authenticated user. Unauthenticated users are redirected to `/login` by `AppShell`.
