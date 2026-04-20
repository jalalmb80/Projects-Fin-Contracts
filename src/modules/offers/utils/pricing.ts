import { LineItem } from '../types';

export function calculateLineTotal(
  item: Pick<LineItem, 'quantity' | 'unit_price' | 'discount_pct'>,
): number {
  const gross = item.quantity * item.unit_price;
  const discount = gross * (item.discount_pct / 100);
  return Math.round((gross - discount) * 100) / 100;
}

export interface PricingTotals {
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_value: number;
}

export function calculateTotals(
  lineItems: LineItem[],
  globalDiscountPct: number,
  vatRate: number,
): PricingTotals {
  const included = lineItems.filter(i => i.is_included);
  const subtotal = Math.round(included.reduce((s, i) => s + i.line_total, 0) * 100) / 100;
  const discount_amount = Math.round(subtotal * (globalDiscountPct / 100) * 100) / 100;
  const afterDiscount = subtotal - discount_amount;
  const vat_amount = Math.round(afterDiscount * (vatRate / 100) * 100) / 100;
  const total_value = Math.round((afterDiscount + vat_amount) * 100) / 100;
  return { subtotal, discount_amount, vat_amount, total_value };
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
