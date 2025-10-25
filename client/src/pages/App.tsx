/**
 * App.tsx - Main Application with New Modular Menu System
 * Last Edited: 2025-10-24 by Assistant - FIXED: Removed phantom GameScreen import!
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GameProvider } from '@/context/GameContext';
import { MenuProvider } from '@/components/menu/MenuProvider';
import { MenuHost } from '@/components/menu/MenuHost';
import { ToastContainer } from '@/utils/toast';
import { initializeMenuRegistry } from '@/components/menu/MenuRegistry';

// Import your existing components - FIXED: Use GameGUI instead of non-existent GameScreen
import GameGUI from '@/components/GameGUI';

/**
 * 🎯 MAIN APP - NOW WITH MODULAR MENU SYSTEM!
 * 
 * What's new:
 * - MenuProvider wraps everything (global menu state)
 * - MenuHost renders active menu via portal (eliminates z-index conflicts)
 * - ToastContainer for user feedback
 * - Menu registry initialization
 * - Clean provider hierarchy
 * - FIXED: Uses GameGUI (exists) instead of GameScreen (phantom)
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
            {/* 🎮 Main Game Content - FIXED: Uses GameGUI */}
            <GameGUI />
            
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