import React, { createContext, useContext, useState } from 'react';
import {
  ProjectStatus, MilestoneStatus, SubscriptionStatus, SubscriptionDirection,
  BillingCycle, InvoiceTiming, DocumentType, DocumentDirection, DocumentStatus,
  TaxProfile, CounterpartyType, ContractType, PaymentMethod, PaymentDirection,
  Currency
} from '../types';

type Lang = 'ar' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

export function t(ar: string, en: string, lang: Lang) {
  return lang === 'ar' ? ar : en;
}

// Translates enum values to Arabic when lang==='ar', keeps English value otherwise.
// The enum value itself is always stored in Firestore — only the displayed label changes.
const ENUM_AR: Record<string, string> = {
  // ProjectStatus
  [ProjectStatus.Planned]:    'مخطط',
  [ProjectStatus.Active]:     'نشط',
  [ProjectStatus.OnHold]:     'موقوف',
  [ProjectStatus.Completed]:  'مكتمل',
  [ProjectStatus.Cancelled]:  'ملغي',
  // MilestoneStatus
  [MilestoneStatus.Pending]:    'قيد الانتظار',
  [MilestoneStatus.InProgress]: 'قيد التنفيذ',
  [MilestoneStatus.Completed]:  'مكتمل',
  [MilestoneStatus.Invoiced]:   'تمت فوترته',
  // SubscriptionStatus
  [SubscriptionStatus.Draft]:     'مسودة',
  [SubscriptionStatus.Active]:    'نشط',
  [SubscriptionStatus.Suspended]: 'معلّق',
  [SubscriptionStatus.Cancelled]: 'ملغي',
  [SubscriptionStatus.Expired]:   'منتهي',
  // SubscriptionDirection
  [SubscriptionDirection.AR]: 'مستحقات (AR)',
  [SubscriptionDirection.AP]: 'مدفوعات (AP)',
  // BillingCycle
  [BillingCycle.Monthly]:   'شهري',
  [BillingCycle.Quarterly]: 'ربع سنوي',
  [BillingCycle.Yearly]:    'سنوي',
  [BillingCycle.Custom]:    'مخصص',
  // InvoiceTiming
  [InvoiceTiming.InAdvance]: 'مسبق',
  [InvoiceTiming.InArrears]: 'لاحق',
  // DocumentType
  [DocumentType.Invoice]:    'فاتورة',
  [DocumentType.CreditNote]: 'إشعار دائن',
  // DocumentDirection
  [DocumentDirection.AR]: 'مستحقات (AR)',
  [DocumentDirection.AP]: 'مدفوعات (AP)',
  [DocumentDirection.IC]: 'بين الكيانات (IC)',
  // DocumentStatus
  [DocumentStatus.Draft]:           'مسودة',
  [DocumentStatus.PendingApproval]: 'بانتظار الاعتماد',
  [DocumentStatus.Approved]:        'معتمد',
  [DocumentStatus.Issued]:          'صادر',
  [DocumentStatus.Sent]:            'مُرسل',
  [DocumentStatus.PartiallyPaid]:   'مدفوع جزئياً',
  [DocumentStatus.Paid]:            'مدفوع',
  [DocumentStatus.Overdue]:         'متأخر',
  [DocumentStatus.Void]:            'ملغي',
  // TaxProfile
  [TaxProfile.Standard]:     'قياسي (15%)',
  [TaxProfile.Export]:       'تصدير (0%)',
  [TaxProfile.Intercompany]: 'بين الكيانات (0%)',
  // CounterpartyType
  [CounterpartyType.CUSTOMER]:    'عميل',
  [CounterpartyType.VENDOR]:      'مورّد',
  [CounterpartyType.BOTH]:        'عميل ومورّد',
  [CounterpartyType.INTERCOMPANY]:'داخلي',
  // ContractType
  [ContractType.FIXED]:     'سعر ثابت',
  [ContractType.TM]:        'وقت ومواد',
  [ContractType.MILESTONE]: 'مراحل',
  // PaymentMethod
  [PaymentMethod.BANK]:     'تحويل بنكي',
  [PaymentMethod.CASH]:     'نقداً',
  [PaymentMethod.CARD]:     'بطاقة',
  [PaymentMethod.TRANSFER]: 'تحويل',
  // PaymentDirection
  [PaymentDirection.IN]:  'وارد',
  [PaymentDirection.OUT]: 'صادر',
  // Currency — keep technical codes, they are universally understood
  [Currency.SAR]: 'ر.س (SAR)',
  [Currency.USD]: 'دولار (USD)',
};

export function tEnum(value: string, lang: Lang): string {
  if (lang === 'ar' && ENUM_AR[value] !== undefined) return ENUM_AR[value];
  return value;
}
