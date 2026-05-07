import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PlatformProvider } from './core/context/PlatformContext';
import { SharedClientsProvider } from './core/context/SharedClientsContext';
import { GlobalSettingsProvider } from './core/context/GlobalSettingsContext';
import AppShell from './core/components/AppShell';

// Top-level error boundary catches unhandled JS errors in any module subtree
// (e.g. a bad Firestore snapshot shape crashing a component). Without this
// the entire app goes blank with no feedback to the user.
interface EBState { error: Error | null; }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <div className="text-center max-w-md px-8 py-10 bg-white rounded-xl shadow border border-slate-100">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-6 font-mono break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PlatformProvider>
          {/* SharedClientsProvider opens ONE onSnapshot on shared_clients.
              Finance (AppContext) and CMS (useContracts) both call
              useSharedClients() which now reads from this singleton context
              instead of opening their own duplicate listeners. */}
          <SharedClientsProvider>
            <GlobalSettingsProvider>
              <AppShell />
            </GlobalSettingsProvider>
          </SharedClientsProvider>
        </PlatformProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
