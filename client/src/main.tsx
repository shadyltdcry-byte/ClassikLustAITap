/**
 * main.tsx - Application Entry Point with Debug Error Boundary
 * Last Edited: 2025-10-24 by Assistant - DEBUG FIX: Added error boundary to reveal client crashes
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Enhanced global error listeners
window.addEventListener('error', (e) => {
  console.error('🚨 Global window error:', e.error || e.message || e);
  console.error('🚨 Filename:', e.filename);
  console.error('🚨 Line:', e.lineno, 'Col:', e.colno);
  console.error('🚨 Stack:', e.error?.stack);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 Global unhandled rejection:', e.reason || e);
  if (e.reason?.stack) {
    console.error('🚨 Stack:', e.reason.stack);
  }
  e.preventDefault(); // Prevent default browser behavior
});

/**
 * 🛡️ ROOT ERROR BOUNDARY
 * Catches React errors and displays them instead of blank screen
 */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any; hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, hasError: false };
  }
  
  static getDerivedStateFromError(error: any) {
    return { error, hasError: true };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error('🚨 React Error Boundary caught error:', error);
    console.error('🚨 Error Info:', errorInfo);
    console.error('🚨 Component Stack:', errorInfo?.componentStack);
    console.error('🚨 Stack:', error?.stack);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          color: '#fff',
          background: '#111',
          fontFamily: 'monospace',
          minHeight: '100vh',
          overflow: 'auto'
        }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: '16px' }}>🚨 CLIENT CRASHED</h2>
          <div style={{ background: '#222', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
          </div>
          <div style={{ background: '#222', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <strong>Error Name:</strong> {this.state.error?.name || 'Unknown'}
          </div>
          <div style={{ background: '#222', padding: '16px', borderRadius: '8px' }}>
            <strong>Full Stack Trace:</strong>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              fontSize: '12px',
              marginTop: '8px',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {String(this.state.error?.stack || this.state.error || 'No stack trace available')}
            </pre>
          </div>
          <button 
            onClick={() => {
              this.setState({ error: null, hasError: false });
              window.location.reload();
            }}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }
    
    return this.props.children as any;
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

// Log mount attempt
console.log('🎮 [MAIN] Mounting ClassikLustAITap client...');

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

console.log('🎮 [MAIN] App render initiated - if blank screen persists, check error boundary above');
