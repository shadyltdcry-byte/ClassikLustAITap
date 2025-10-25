/**
 * main.tsx - Application Entry Point with Auto-Repair System
 */

import './preflight/component-sanity'; // Auto-repair diagnostics before React mounts
import './utils/auto-repair-client'; // Client-side repair utilities

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
  
  static getDerivedStateFromError(error: any) { 
    return { error, hasError: true }; 
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error('🚨 React Error Boundary caught error:', error, errorInfo);
    
    // Check for auto-repair suggestions
    const probe = (window as any).__BOOT_PROBE__;
    const autoFixes = (window as any).__AUTO_REPAIR_FIXES__;
    
    if (probe?.failures?.length) {
      console.error('[BOOT_PROBE] Failures detected:', probe.failures);
    }
    
    if (autoFixes?.length) {
      console.log('🔧 [AUTO-REPAIR] Suggestions available:', autoFixes);
    }
  }
  
  render() {
    if (this.state.hasError) {
      const probe = (window as any).__BOOT_PROBE__;
      const autoFixes = (window as any).__AUTO_REPAIR_FIXES__ || [];
      
      return (
        <div style={{ 
          padding: 20, 
          color: '#00ff88', 
          background: '#001122', 
          minHeight: '100vh', 
          fontFamily: 'ui-monospace,Menlo,Consolas,monospace',
          fontSize: 12
        }}>
          <div style={{ fontSize: 18, color: '#00ff88', marginBottom: 16 }}>
            🤖 AUTO-REPAIR ERROR BOUNDARY
          </div>
          
          <div style={{ marginBottom: 16 }}>
            React crashed with "Element type is invalid" - this usually means an import/export mismatch.
          </div>
          
          {/* Auto-repair suggestions */}
          {autoFixes.length > 0 && (
            <div style={{ 
              background: '#112200', 
              border: '1px solid #44aa00', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 16 
            }}>
              <div style={{ color: '#ffdd00', fontSize: 14, marginBottom: 12 }}>
                🔧 AUTO-REPAIR READY ({autoFixes.length} fixes available)
              </div>
              
              {autoFixes.map((fix: any, i: number) => (
                <div key={i} style={{ 
                  margin: '8px 0', 
                  padding: 8, 
                  background: '#001100', 
                  borderRadius: 4,
                  borderLeft: '3px solid #00aa55'
                }}>
                  <div style={{ color: '#00dd88', fontWeight: 'bold' }}>{fix.name}</div>
                  <div style={{ color: '#888', fontSize: 10, margin: '4px 0' }}>{fix.issue}</div>
                  <div style={{ color: '#ff8888', fontSize: 10 }}>Current: <code>{fix.currentImport}</code></div>
                  <div style={{ color: '#88ff88', fontSize: 10 }}>Fixed: <code>{fix.correctImport}</code></div>
                </div>
              ))}
              
              <button 
                onClick={() => {
                  const autoRepair = (window as any).__applyAutoFixes;
                  if (autoRepair) {
                    autoRepair();
                  } else {
                    alert('Auto-repair not available. Please refresh and try again.');
                  }
                }}
                style={{
                  marginTop: 12,
                  padding: '12px 24px',
                  background: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold'
                }}
              >
                🚀 AUTO-REPAIR NOW
              </button>
            </div>
          )}
          
          {/* Boot probe failures */}
          {probe?.failures?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#ffaa00', marginBottom: 8 }}>Boot Probe Findings:</div>
              {probe.failures.map((f: any, i: number) => (
                <div key={i} style={{ 
                  border: '1px dashed #ff6b6b', 
                  padding: 8, 
                  marginBottom: 8,
                  borderRadius: 4,
                  background: '#220011'
                }}>
                  <div>❌ <strong>{f.name}</strong></div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>Path: {f.path}</div>
                  <div style={{ fontSize: 10 }}>Expected: {f.expected} | Actual: {f.actual}</div>
                  <div style={{ color: '#ffe08a', fontSize: 10, marginTop: 4 }}>💡 {f.suggestion}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Fallback manual options */}
          {autoFixes.length === 0 && (
            <div style={{ 
              background: '#220000', 
              border: '1px solid #aa4400', 
              padding: 16, 
              borderRadius: 8, 
              marginBottom: 16 
            }}>
              <div style={{ color: '#ffaa00', marginBottom: 8 }}>Manual Recovery Options:</div>
              <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                1. Check console for "Element type is invalid" details<br/>
                2. Look for import/export mismatches in GameGUI.tsx<br/>
                3. Try: import ComponentName vs import {{ ComponentName }}<br/>
                4. Refresh page to re-run auto-repair diagnostics
              </div>
            </div>
          )}
          
          {/* Error details */}
          <details style={{ marginTop: 16 }}>
            <summary style={{ color: '#ffaa00', cursor: 'pointer' }}>Full Error Details</summary>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              marginTop: 8, 
              fontSize: 10, 
              background: '#110000',
              padding: 12,
              borderRadius: 4,
              border: '1px solid #440000',
              maxHeight: 200,
              overflow: 'auto'
            }}>
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          </details>
          
          <div style={{ marginTop: 20 }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                background: '#444',
                color: 'white',
                border: '1px solid #666',
                borderRadius: 4,
                cursor: 'pointer',
                marginRight: 8
              }}
            >
              🔄 Reload Page
            </button>
            
            <button 
              onClick={() => this.setState({ error: null, hasError: false })}
              style={{
                padding: '8px 16px',
                background: '#006600',
                color: 'white',
                border: '1px solid #008800',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              🚑 Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children as any;
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
console.log('🤖 [MAIN] Mounting with auto-repair system...');

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
