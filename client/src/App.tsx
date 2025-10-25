/**
 * App.tsx - Main Application with Debug Error Handling
 * Last Edited: 2025-10-24 by Assistant - DEBUG FIX: Simplified with visible error states
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from '@/utils/toast.tsx';

// Import components carefully
let GameProvider: any;
let MenuProvider: any;
let MenuHost: any;
let GameGUI: any;
let initializeMenuRegistry: any;

try {
  const gameContextModule = require('@/context/GameContext');
  GameProvider = gameContextModule.GameProvider;
  console.log('✅ GameProvider imported successfully');
} catch (error) {
  console.error('❌ Failed to import GameProvider:', error);
}

try {
  const menuProviderModule = require('@/components/menu/MenuProvider');
  MenuProvider = menuProviderModule.MenuProvider;
  console.log('✅ MenuProvider imported successfully');
} catch (error) {
  console.error('❌ Failed to import MenuProvider:', error);
}

try {
  const menuHostModule = require('@/components/menu/MenuHost');
  MenuHost = menuHostModule.MenuHost;
  console.log('✅ MenuHost imported successfully');
} catch (error) {
  console.error('❌ Failed to import MenuHost:', error);
}

try {
  const gameGuiModule = require('@/components/GameGUI');
  GameGUI = gameGuiModule.default;
  console.log('✅ GameGUI imported successfully');
} catch (error) {
  console.error('❌ Failed to import GameGUI:', error);
}

try {
  const menuRegistryModule = require('@/components/menu/MenuRegistry');
  initializeMenuRegistry = menuRegistryModule.initializeMenuRegistry;
  console.log('✅ MenuRegistry imported successfully');
} catch (error) {
  console.error('❌ Failed to import MenuRegistry:', error);
}

/**
 * 🎯 MAIN APP - WITH COMPREHENSIVE ERROR HANDLING
 */
function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    console.log('🎯 [APP] Starting initialization...');
    
    // Check if all imports succeeded
    const missingImports = [];
    if (!GameProvider) missingImports.push('GameProvider');
    if (!MenuProvider) missingImports.push('MenuProvider');
    if (!MenuHost) missingImports.push('MenuHost');
    if (!GameGUI) missingImports.push('GameGUI');
    if (!initializeMenuRegistry) missingImports.push('initializeMenuRegistry');
    
    if (missingImports.length > 0) {
      const errorMsg = `Failed to import: ${missingImports.join(', ')}`;
      console.error('❌ [APP] Import errors:', errorMsg);
      setError(errorMsg);
      setStatus('error');
      return;
    }
    
    // Initialize menu registry
    try {
      if (initializeMenuRegistry) {
        initializeMenuRegistry();
        console.log('✅ [APP] Menu registry initialized');
      }
    } catch (menuError) {
      console.error('❌ [APP] Menu registry failed:', menuError);
      setError(`Menu system failed: ${menuError}`);
      setStatus('error');
      return;
    }
    
    // All good!
    setStatus('ready');
    console.log('✅ [APP] App initialization complete');
  }, []);
  
  // Loading state
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>Loading ClassikLust AI Tap...</p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Initializing game systems</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  // Error state
  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '32px',
          borderRadius: '16px',
          border: '2px solid #dc2626',
          textAlign: 'center',
          maxWidth: '600px'
        }}>
          <h2 style={{ color: '#fca5a5', marginBottom: '16px', fontSize: '24px' }}>
            🚨 App Initialization Error
          </h2>
          <div style={{ background: 'rgba(255,0,0,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '16px', wordBreak: 'break-word' }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Reload App
          </button>
        </div>
      </div>
    );
  }
  
  // Ready state - render main app
  if (!GameProvider || !MenuProvider || !GameGUI) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>🚨 Missing Components</h2>
          <p>Required components failed to load</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '16px', padding: '12px 24px', background: '#dc2626',
            color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
          }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <GameProvider>
        <MenuProvider>
          <div className="App" style={{ minHeight: '100vh' }}>
            <GameGUI />
            {MenuHost && <MenuHost />}
            <ToastContainer position="top" />
          </div>
        </MenuProvider>
      </GameProvider>
    </Router>
  );
}

export default App;
