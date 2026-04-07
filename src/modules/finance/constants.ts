import { AppSettings, Currency } from './types';

export const INITIAL_SETTINGS: AppSettings = {
  sarToUsdRate: 0.2666,
  usdToSarRate: 3.75,
  defaultWBSCategories: [
    'Development', 'Design', 'Project Management',
    'QA', 'Infrastructure', 'Marketing', 'Sales', 'General'
  ],
  companyName: 'My Company',
  defaultCurrency: Currency.SAR,
  invoicePrefix: 'INV-',
  defaultPaymentTermsDays: 30
};
