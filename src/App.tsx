import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PlatformProvider } from './core/context/PlatformContext';
import { GlobalSettingsProvider } from './core/context/GlobalSettingsContext';
import AppShell from './core/components/AppShell';

export default function App() {
  return (
    <BrowserRouter>
      <PlatformProvider>
        <GlobalSettingsProvider>
          <AppShell />
        </GlobalSettingsProvider>
      </PlatformProvider>
    </BrowserRouter>
  );
}
