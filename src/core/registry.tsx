import React from 'react';
import { PlatformModule } from './types/platform';

const FinanceModule = React.lazy(() => import('../modules/finance/routes'));
const CMSModule = React.lazy(() => import('../modules/cms/routes'));

export const MODULES: PlatformModule[] = [
  {
    id: 'finance',
    name: 'Finance',
    nameAr: 'المالية',
    icon: 'TrendingUp',
    basePath: '/finance',
    color: '#0ea5e9',
    enabled: true,
    component: FinanceModule,
  },
  {
    id: 'cms',
    name: 'Contracts',
    nameAr: 'إدارة العقود',
    icon: 'ScrollText',
    basePath: '/cms',
    color: '#10b981',
    enabled: true,
    component: CMSModule,
  },
];
