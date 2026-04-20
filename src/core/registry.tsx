import React from 'react';
import { PlatformModule } from './types/platform';

const FinanceModule = React.lazy(() => import('../modules/finance/routes'));
const CMSModule     = React.lazy(() => import('../modules/cms/routes'));
const OffersModule  = React.lazy(() => import('../modules/offers/routes'));

export const MODULES: PlatformModule[] = [
  {
    id: 'finance',
    name: 'Finance',
    nameAr: '\u0627\u0644\u0645\u0627\u0644\u064a\u0629',
    icon: 'TrendingUp',
    basePath: '/finance',
    color: '#0ea5e9',
    enabled: true,
    component: FinanceModule,
  },
  {
    id: 'cms',
    name: 'Contracts',
    nameAr: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0642\u0648\u062f',
    icon: 'ScrollText',
    basePath: '/cms',
    color: '#10b981',
    enabled: true,
    component: CMSModule,
  },
  {
    id: 'offers',
    name: 'Offers',
    nameAr: '\u0627\u0644\u0639\u0631\u0648\u0636',
    icon: 'FileText',
    basePath: '/offers',
    color: '#8b5cf6',
    enabled: true,
    component: OffersModule,
  },
];
