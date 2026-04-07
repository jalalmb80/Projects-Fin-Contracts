export enum Currency {
  USD = 'USD',
  SAR = 'SAR'
}

export enum ProjectStatus {
  Planned = 'Planned',
  Active = 'Active',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export enum MilestoneStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Invoiced = 'Invoiced'
}

export enum SubscriptionStatus {
  Draft = 'Draft',
  Active = 'Active',
  Suspended = 'Suspended',
  Cancelled = 'Cancelled',
  Expired = 'Expired'
}

export enum SubscriptionDirection {
  AR = 'AR',
  AP = 'AP'
}

export enum BillingCycle {
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Yearly = 'Yearly',
  Custom = 'Custom'
}

export enum InvoiceTiming {
  InAdvance = 'InAdvance',
  InArrears = 'InArrears'
}

export enum DocumentType {
  Invoice = 'Invoice',
  CreditNote = 'CreditNote'
}

export enum DocumentDirection {
  AR = 'AR',
  AP = 'AP',
  IC = 'IC'
}

export enum DocumentStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Issued = 'Issued',
  Sent = 'Sent',
  PartiallyPaid = 'PartiallyPaid',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Void = 'Void'
}

export enum TaxProfile {
  Standard = 'Standard',
  Export = 'Export',
  Intercompany = 'Intercompany'
}

export enum CounterpartyType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  BOTH = 'BOTH',
  INTERCOMPANY = 'INTERCOMPANY'
}

export enum ContractType {
  FIXED = 'FIXED',
  TM = 'T&M',
  MILESTONE = 'MILESTONE'
}

export enum PaymentMethod {
  BANK = 'BANK',
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER'
}

export enum PaymentDirection {
  IN = 'IN',
  OUT = 'OUT'
}

export interface Counterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTermsDays: number;
  currency: Currency;
  notes?: string;
  createdAt: string;
}

export interface LegalEntity {
  id: string;
  name: string;
  taxId: string;
  address: string;
  currency: Currency;
  logoUrl?: string;
}

export interface WBSItem {
  id: string;
  name: string;
  budget: number;
  spent: number;
  tags: string[];
  categoryId?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string;
  completionDate?: string;
  percentOfContract: number;
  amount: number;
  status: MilestoneStatus;
  linkedInvoiceId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  contractType: ContractType;
  contractValue: number;
  baseCurrency: Currency;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  wbs: WBSItem[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode: TaxProfile;
}

export interface Subscription {
  id: string;
  name: string;
  legalEntityId: string;
  direction: SubscriptionDirection;
  counterpartyId: string;
  linkedProjectId?: string;
  status: SubscriptionStatus;
  currency: Currency;
  startDate: string;
  contractEndDate?: string;
  billingCycle: BillingCycle;
  billingInterval?: number;
  invoiceTiming: InvoiceTiming;
  paymentTermsDays: number;
  autoRenew: boolean;
  nextInvoiceDate: string;
  lastInvoiceDate?: string;
  items: SubscriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode: TaxProfile;
  taxAmount: number;
  subtotal: number;
  total: number;
  wbsItemId?: string;
  milestoneId?: string;
}

export interface BillingDocument {
  id: string;
  documentNumber?: string;
  type: DocumentType;
  direction: DocumentDirection;
  status: DocumentStatus;
  date: string;
  dueDate: string;
  counterpartyId: string;
  counterpartyName: string;
  fromEntityId?: string;
  toEntityId?: string;
  projectId?: string;
  milestoneId?: string;
  subscriptionId?: string;
  currency: Currency;
  exchangeRate: number;
  lines: BillingLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  balance: number;
  paidAmount: number;
  taxProfile: TaxProfile;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  date: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  counterpartyId: string;
  direction: PaymentDirection;
  reference?: string;
  method: PaymentMethod;
  notes?: string;
  allocations: PaymentAllocation[];
  unallocatedAmount: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  active: boolean;
  defaultPrices: Record<Currency, number>;
  defaultTaxCode: TaxProfile;
  unitLabel?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: Currency;
  description: string;
  referenceId?: string;
  type: 'CREDIT' | 'DEBIT';
  category: string;
  createdAt: string;
}

export interface AppSettings {
  sarToUsdRate: number;
  usdToSarRate: number;
  defaultWBSCategories: string[];
  companyName: string;
  defaultCurrency: Currency;
  invoicePrefix: string;
  defaultPaymentTermsDays: number;
}

export interface BudgetCategory {
  id: string;
  projectId: string;
  name: string;
  planned: number;
  actual: number;
  notes?: string;
}
