/**
 * Global platform settings — shared across Finance and CMS modules.
 * Stored in Firestore: platform_settings/global
 *
 * Design principle:
 *   GLOBAL  = things both modules care about (company identity, branding, language)
 *   Finance-only = exchange rates, invoice prefix, payment terms, WBS categories
 *   CMS-only = VAT rate for contracts
 */

export interface PlatformEntity {
  id: string;
  // Identity (bilingual)
  name: string;          // English / display name (used by Finance)
  name_ar: string;       // Arabic name (used by CMS)
  // Legal
  taxId: string;         // Finance: taxId, CMS: cr_number equivalent
  cr_number?: string;    // Saudi CR number (CMS)
  representative_name?: string;
  representative_title?: string;
  // Address
  address: string;
  city?: string;
  postal_code?: string;
  po_box?: string;
  // Contact
  phone?: string;
  email?: string;
  // Branding
  logo_url?: string;     // URL (Finance)
  logo_base64?: string;  // Base64 (CMS PDF export)
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  // Banking (CMS contracts)
  bank_iban?: string;
  bank_name?: string;
  account_holder?: string;
  // Meta
  is_default: boolean;
  currency: string;      // default currency for this entity (e.g. "SAR")
}

export interface GlobalSettings {
  /** Platform entities — used as Party One in contracts AND as legal entities in Finance */
  entities: PlatformEntity[];
  /** Default language for the platform */
  default_language: 'ar' | 'en';
  /** Platform-wide default currency code */
  default_currency: string;
}

export const DEFAULT_PLATFORM_ENTITY: PlatformEntity = {
  id: 'e1',
  name: 'Diraya Smart Technology',
  name_ar: '\u0634\u0631\u0643\u0629 \u062f\u0631\u0627\u064a\u0629 \u0627\u0644\u0630\u0643\u064a\u0629 \u0644\u0644\u062a\u0642\u0646\u064a\u0629',
  taxId: '2051235281',
  cr_number: '2051235281',
  representative_name: '\u0628\u0631\u0627\u0621 \u0627\u0644\u0645\u0646\u062c\u062f',
  representative_title: '\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0627\u0645',
  address: '\u0637\u0631\u064a\u0642 \u0627\u0644\u0638\u0647\u0631\u0627\u0646 \u2013 \u062d\u064a \u0627\u0644\u0642\u0635\u0648\u0631',
  city: '\u0627\u0644\u062e\u0628\u0631',
  postal_code: '31952',
  po_box: '',
  phone: '0138655355',
  email: 'baraa@dirayaah.com',
  logo_url: '',
  logo_base64: undefined,
  primary_color: '#059669',
  secondary_color: '#f0fdf4',
  accent_color: '#064e3b',
  bank_iban: 'SA865134841770007',
  bank_name: '\u0628\u0646\u0643 \u0627\u0644\u0628\u0644\u0627\u062f',
  account_holder: '\u0634\u0631\u0643\u0629 \u062f\u0631\u0627\u064a\u0629 \u0627\u0644\u0630\u0643\u064a\u0629 \u0644\u062a\u0642\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a',
  is_default: true,
  currency: 'SAR',
};

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  entities: [DEFAULT_PLATFORM_ENTITY],
  default_language: 'ar',
  default_currency: 'SAR',
};
