/**
 * App.tsx - Main Application with Debug Error Handling
 * Last Edited: 2025-10-24 by Assistant - DEBUG FIX: Added defensive error handling
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GameProvider } from '@/context/GameContext';
import { MenuProvider } from '@/components/menu/MenuProvider';
import { MenuHost } from '@/components/menu/MenuHost';
import { ToastContainer } from '@/utils/toast.tsx';
import { initializeMenuRegistry } from '@/components/menu/MenuRegistry';

// Import components with error handling
import GameGUI from '@/components/GameGUI';

/**
 * 🎯 MAIN APP - WITH DEBUG ERROR HANDLING
 */
function App() {
  const [appError, setAppError] = useState<string | null>(null);
  const [menuInitialized, setMenuInitialized] = useState(false);
  
  // Initialize menu registry with error handling
  useEffect(() => {
    console.log('🎯 [APP] Starting menu system initialization...');
    try {
      initializeMenuRegistry();
      setMenuInitialized(true);
      console.log('✅ [APP] Menu system initialized successfully!');
    } catch (error) {
      console.error('❌ [APP] Menu system initialization failed:', error);
      setAppError(`Menu system failed: ${error}`);
    }
  }, []);
  
  // If there's an app-level error, show it clearly
  if (appError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #7c2d12, #991b1b)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
          <p style={{ marginBottom: '16px', fontSize: '16px' }}>
            {appError}
          </p>
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
  
  // Show loading state while menu initializes
  if (!menuInitialized) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #1e1b4b, #312e81)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
      </div>
    );
  }
  
  // Main app with error boundaries on each provider
  try {
    return (
      <Router>
        {/* 🎮 Game State Provider with error boundary */}
        <GameProviderWrapper>
          {/* 🎯 Menu System Provider with error boundary */}
          <MenuProviderWrapper>
            <div className="App" style={{ minHeight: '100vh' }}>
              {/* 🎮 Main Game Content */}
              <GameGUIWrapper />
              
              {/* 🎯 Menu Portal Host */}
              <MenuHost />
              
              {/* 🍞 Toast Notifications */}
              <ToastContainer position="top" />
            </div>
          </MenuProviderWrapper>
        </GameProviderWrapper>
      </Router>
    );
  } catch (error) {
    console.error('🚨 [APP] Render error:', error);
    setAppError(`App render failed: ${error}`);
    return null;
  }
}

/**
 * 🛡️ GAME PROVIDER WRAPPER WITH ERROR BOUNDARY
 */
function GameProviderWrapper({ children }: { children: React.ReactNode }) {
  try {
    return <GameProvider>{children}</GameProvider>;
  } catch (error) {
    console.error('🚨 [GameProvider] Failed to initialize:', error);
    return (
      <div style={{
        minHeight: '100vh',
        background: '#7f1d1d',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '32px', borderRadius: '16px' }}>
          <h2>🚨 Game Context Failed</h2>
          <p>Error: {String(error)}</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '16px', padding: '8px 16px', background: '#dc2626', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

/**
 * 🛡️ MENU PROVIDER WRAPPER WITH ERROR BOUNDARY
 */
function MenuProviderWrapper({ children }: { children: React.ReactNode }) {
  try {
    return <MenuProvider>{children}</MenuProvider>;
  } catch (error) {
    console.error('🚨 [MenuProvider] Failed to initialize:', error);
    return (
      <div style={{
        minHeight: '100vh',
        background: '#7f1d1d',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '32px', borderRadius: '16px' }}>
          <h2>🚨 Menu System Failed</h2>
          <p>Error: {String(error)}</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '16px', padding: '8px 16px', background: '#dc2626', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

/**
 * 🛡️ GAME GUI WRAPPER WITH ERROR BOUNDARY
 */
function GameGUIWrapper() {
  try {
    return <GameGUI />;
  } catch (error) {
    console.error('🚨 [GameGUI] Failed to render:', error);
    return (
      <div style={{
        minHeight: '100vh',
        background: '#7f1d1d',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '32px', borderRadius: '16px' }}>
          <h2>🚨 Game GUI Failed</h2>
          <p>Error: {String(error)}</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '16px', padding: '8px 16px', background: '#dc2626', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default App;
