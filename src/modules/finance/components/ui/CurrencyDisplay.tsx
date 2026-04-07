import React from 'react';
import { useApp } from '../../context/AppContext';
import { Currency } from '../../types';

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency | string;
  className?: string;
}

export function CurrencyDisplay({ amount, currency, className }: CurrencyDisplayProps) {
  const { settings } = useApp();

  // In a real app, we might want to convert everything to the base currency (e.g. USD)
  // or display in the original currency. For now, we just format it.
  
  // Example conversion logic if we wanted to show everything in USD:
  // const displayAmount = currency === 'SAR' && settings.defaultCurrency === 'USD' 
  //   ? amount * settings.sarToUsdRate 
  //   : amount;
  // const displayCurrency = settings.defaultCurrency;

  // But usually, we want to show the transaction currency.
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  return (
    <span className={className}>
      {formatted}
    </span>
  );
}
