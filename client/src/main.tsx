/**
 * main.tsx - Application Entry Point with Preflight Probe + Error Boundary
 */

import './preflight/component-sanity'; // run preflight before React mounts

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Enhanced global error listeners
window.addEventListener('error', (e) => {
  console.error('🚨 Global window error:', e.error || e.message || e);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 Global unhandled rejection:', e.reason || e);
  e.preventDefault();
});

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any; hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, hasError: false };
  }
  static getDerivedStateFromError(error: any) { return { error, hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('🚨 React Error Boundary caught error:', error, errorInfo);
    // If boot probe had failures, surface them inline for convenience
    const probe = (window as any).__BOOT_PROBE__;
    if (probe?.failures?.length) {
      console.error('[BOOT_PROBE] Failures:', probe.failures);
    }
  }
  render() {
    if (this.state.hasError) {
      const probe = (window as any).__BOOT_PROBE__;
      return (
        <div style={{ padding: 16, color: '#fff', background: '#1b1030', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#ff6b6b' }}>🚨 CLIENT CRASHED</h2>
          <div>Element type invalid usually means an import/export mismatch.</div>
          {probe?.failures?.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: '#ffd166', marginBottom: 8 }}>Boot Probe Findings:</div>
              {probe.failures.map((f:any, i:number) => (
                <div key={i} style={{ border: '1px dashed #ff6b6b', padding: 8, marginBottom: 8 }}>
                  <div>❌ <b>{f.name}</b></div>
                  <div>Path: {f.path}</div>
                  <div>Expected: {f.expected} | Actual: {f.actual}</div>
                  <div style={{ color: '#ffe08a' }}>💡 {f.suggestion}</div>
                </div>
              ))}
            </div>
          ) : null}
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{String(this.state.error?.stack || this.state.error)}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12 }}>Reload</button>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
console.log('🎮 [MAIN] Mounting client...');
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
