/**
 * App.tsx - Main Application with New Modular Menu System
 * Last Edited: 2025-10-24 by Assistant - Integrated stack-based menu system (NO MORE Z-INDEX HELL!)
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { MenuProvider } from './components/menu/MenuProvider';
import { MenuHost } from './components/menu/MenuHost';
import { ToastContainer } from './utils/toast';
import { initializeMenuRegistry } from './components/menu/MenuRegistry';

// Import your existing components
import GameScreen from './components/GameScreen';

/**
 * 🎯 MAIN APP - NOW WITH MODULAR MENU SYSTEM!
 * 
 * What's new:
 * - MenuProvider wraps everything (global menu state)
 * - MenuHost renders active menu via portal (eliminates z-index conflicts)
 * - ToastContainer for user feedback
 * - Menu registry initialization
 * - Clean provider hierarchy
 */
function App() {
  // Initialize menu registry on app start
  useEffect(() => {
    console.log('🎯 [APP] Initializing modular menu system...');
    try {
      initializeMenuRegistry();
      console.log('✅ [APP] Menu system ready!');
    } catch (error) {
      console.error('❌ [APP] Failed to initialize menu system:', error);
    }
  }, []);
  
  return (
    <Router>
      {/* 🎮 Game State Provider */}
      <GameProvider>
        {/* 🎯 Menu System Provider */}
        <MenuProvider>
          <div className="App">
            {/* 🎮 Main Game Content */}
            <GameScreen />
            
            {/* 🎯 Menu Portal Host - Renders active menu */}
            <MenuHost />
            
            {/* 🍞 Toast Notifications */}
            <ToastContainer position="top" />
          </div>
        </MenuProvider>
      </GameProvider>
    </Router>
  );
}

export default App;