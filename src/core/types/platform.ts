import React from 'react';

export interface PlatformModule {
  id: string;
  name: string;
  nameAr: string;
  icon: string;           // lucide icon name
  basePath: string;       // e.g. '/finance' or '/cms'
  color: string;          // accent hex for this module's theme
  enabled: boolean;
  component: React.LazyExoticComponent<any>;
}

export interface PlatformUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  enabledModules: string[]; // list of module ids this user can access
  role: 'admin' | 'viewer' | 'editor';
}
