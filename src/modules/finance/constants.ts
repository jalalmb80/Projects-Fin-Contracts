import { AppSettings, Currency } from './types';

export const INITIAL_SETTINGS: AppSettings = {
  sarToUsdRate: 0.2666,
  usdToSarRate: 3.75,
  // KSA standard VAT rate as of 2020-07-01. Change via Settings page — do not
  // hard-code this value anywhere else in the codebase.
  vatRate: 0.15,
  defaultWBSCategories: [
    'Development', 'Design', 'Project Management',
    'QA', 'Infrastructure', 'Marketing', 'Sales', 'General'
  ],
  companyName: 'My Company',
  defaultCurrency: Currency.SAR,
  invoicePrefix: 'INV-',
  defaultPaymentTermsDays: 30
};
