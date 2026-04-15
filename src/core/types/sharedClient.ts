// =============================================================================
// src/core/types/sharedClient.ts
//
// Canonical cross-module customer / vendor record.
// Firestore collection: shared_clients
//
// Architecture:
//   - ONE source of truth — replaces Finance /counterparties (CUSTOMER/BOTH)
//     AND CMS /cms_clients simultaneously.
//   - toFinanceCounterparty() / toCmsClient() are adapter views that make the
//     shape transparent to existing module code — zero refactor needed there.
//   - VENDOR-only Finance counterparties stay in /counterparties until a
//     dedicated vendor module is built.
//   - modules[] tracks which modules have actively linked records so the UI
//     shows "used in Finance / CMS" badges per client.
//   - Any future module (HR, CRM …) calls useSharedClients() directly —
//     no new Firestore collection, no new type file.
//
// UX form tabs:
//   Tab 1 — identity  : name, type, entity_type, tax / licence IDs
//   Tab 2 — contact   : representative, email, phone, full address
//   Tab 3 — financial : currency, payment terms, credit limit, notes
//   Tab 4 — meta      : tags, modules badges, status, audit timestamps
// =============================================================================

export type SharedClientType =
  | 'CUSTOMER'
  | 'VENDOR'
  | 'BOTH'
  | 'INTERCOMPANY';

export type SharedClientEntityType =
  | 'شركة'
  | 'جمعية'
  | 'جهة حكومية'
  | 'فرد';

export type SharedClientStatus = 'active' | 'inactive' | 'blocked';

export type SharedClientModule = 'finance' | 'cms' | string;

export interface SharedClient {
  id: string;

  // ── Tab 1: Identity ────────────────────────────────────────────────────────
  name_ar: string;                      // Arabic legal name (required)
  name_en?: string;                     // English name (optional)
  type: SharedClientType;               // maps to Finance CounterpartyType
  entity_type?: SharedClientEntityType; // maps to CMS Client.entity_type
  tax_id?: string;                      // VAT / national tax number
  license_authority?: string;           // e.g. وزارة التجارة
  license_no?: string;                  // CR / trade licence number
  national_id?: string;                 // personal ID for individual clients

  // ── Tab 2: Contact ─────────────────────────────────────────────────────────
  representative_name?: string;
  representative_title?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  po_box?: string;

  // ── Tab 3: Financial (Finance-centric; CMS reads only) ────────────────────
  currency?: string;            // ISO 4217 — default 'SAR'
  payment_terms_days?: number;  // default 30
  credit_limit?: number;
  notes?: string;

  // ── Tab 4: Meta ────────────────────────────────────────────────────────────
  tags?: string[];
  modules?: SharedClientModule[]; // advisory — which modules use this record
  status?: SharedClientStatus;    // default 'active'
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp
}

// ─── Adapters — drop-in view types for legacy module code ─────────────────────

/**
 * Finance adapter: shaped like the old Counterparty interface.
 * Consumed as: useSharedClients().asFinanceCounterparties
 */
export function toFinanceCounterparty(c: SharedClient) {
  return {
    id:               c.id,
    name:             c.name_ar,
    type:             c.type,
    taxId:            c.tax_id,
    email:            c.email,
    phone:            c.phone,
    address:          c.address,
    contactPerson:    c.representative_name,
    paymentTermsDays: c.payment_terms_days ?? 30,
    currency:         (c.currency ?? 'SAR') as 'SAR' | 'USD',
    notes:            c.notes,
    createdAt:        c.created_at,
  };
}

/**
 * CMS adapter: shaped like the old Client interface.
 * Consumed as: useSharedClients().asCmsClients
 */
export function toCmsClient(c: SharedClient) {
  return {
    id:                   c.id,
    name_ar:              c.name_ar,
    entity_type:          (c.entity_type ?? 'شركة') as SharedClientEntityType,
    license_authority:    c.license_authority ?? '',
    license_no:           c.license_no ?? '',
    representative_name:  c.representative_name ?? '',
    representative_title: c.representative_title ?? '',
    national_id:          c.national_id ?? '',
    address:              c.address ?? '',
    city:                 c.city ?? '',
    postal_code:          c.postal_code ?? '',
    phone:                c.phone ?? '',
    email:                c.email ?? '',
  };
}
