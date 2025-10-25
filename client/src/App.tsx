/**
 * App.tsx - Main Application with Proper ES6 Imports
 * Last Edited: 2025-10-25 by Assistant - IMPORT FIX: Use ES6 imports instead of require()
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from './utils/toast';

// Import components using ES6 imports with error boundaries
let GameProvider: any = null;
let MenuProvider: any = null;
let MenuHost: any = null;
let GameGUI: any = null;
let initializeMenuRegistry: any = null;

// Safe import with error handling
async function loadComponents() {
  const results = {
    GameProvider: false,
    MenuProvider: false,
    MenuHost: false,
    GameGUI: false,
    initializeMenuRegistry: false
  };
  
  try {
    const { GameProvider: GP } = await import('./context/GameContext');
    GameProvider = GP;
    results.GameProvider = true;
    console.log('✅ GameProvider imported successfully');
  } catch (error) {
    console.error('❌ Failed to import GameProvider:', error);
  }
  
  try {
    const { MenuProvider: MP } = await import('./components/menu/MenuProvider');
    MenuProvider = MP;
    results.MenuProvider = true;
    console.log('✅ MenuProvider imported successfully');
  } catch (error) {
    console.error('❌ Failed to import MenuProvider:', error);
  }
  
  try {
    const { MenuHost: MH } = await import('./components/menu/MenuHost');
    MenuHost = MH;
    results.MenuHost = true;
    console.log('✅ MenuHost imported successfully');
  } catch (error) {
    console.error('❌ Failed to import MenuHost:', error);
  }
  
  try {
    const GameGUIModule = await import('./components/GameGUI');
    GameGUI = GameGUIModule.default;
    results.GameGUI = true;
    console.log('✅ GameGUI imported successfully');
  } catch (error) {
    console.error('❌ Failed to import GameGUI:', error);
  }
  
  try {
    const { initializeMenuRegistry: IMR } = await import('./components/menu/MenuRegistry');
    initializeMenuRegistry = IMR;
    results.initializeMenuRegistry = true;
    console.log('✅ MenuRegistry imported successfully');
  } catch (error) {
    console.error('❌ Failed to import MenuRegistry:', error);
  }
  
  return results;
}

/**
 * 🎯 MAIN APP - WITH ASYNC COMPONENT LOADING
 */
function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [loadProgress, setLoadProgress] = useState<string>('Starting...');
  
  useEffect(() => {
    console.log('🎯 [APP] Starting async component loading...');
    setLoadProgress('Loading components...');
    
    loadComponents().then((results) => {
      console.log('🎯 [APP] Component loading results:', results);
      
      // Check which imports failed
      const missingImports = Object.entries(results)
        .filter(([, success]) => !success)
        .map(([name]) => name);
      
      if (missingImports.length > 0) {
        const errorMsg = `Failed to import: ${missingImports.join(', ')}`;
        console.error('❌ [APP] Import errors:', errorMsg);
        setError(errorMsg);
        setStatus('error');
        return;
      }
      
      // Initialize menu registry
      setLoadProgress('Initializing menu system...');
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
      setLoadProgress('Ready!');
      setStatus('ready');
      console.log('✅ [APP] App initialization complete');
    }).catch((loadError) => {
      console.error('❌ [APP] Component loading failed:', loadError);
      setError(`Component loading failed: ${loadError}`);
      setStatus('error');
    });
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
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{loadProgress}</p>
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
          <p style={{ fontSize: '14px', marginTop: '8px' }}>GameProvider: {GameProvider ? '✅' : '❌'}</p>
          <p style={{ fontSize: '14px' }}>MenuProvider: {MenuProvider ? '✅' : '❌'}</p>
          <p style={{ fontSize: '14px' }}>GameGUI: {GameGUI ? '✅' : '❌'}</p>
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
