import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PlatformProvider } from './core/context/PlatformContext';
import AppShell from './core/components/AppShell';

export default function App() {
  return (
    <BrowserRouter>
      <PlatformProvider>
        <AppShell />
      </PlatformProvider>
    </BrowserRouter>
  );
}
