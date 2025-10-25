/**
 * App.tsx - Main Application with New Modular Menu System
 * Last Edited: 2025-10-24 by Assistant - TOAST FIX: Explicit .tsx import per user request (Option A)
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GameProvider } from '@/context/GameContext';
import { MenuProvider } from '@/components/menu/MenuProvider';
import { MenuHost } from '@/components/menu/MenuHost';
import { ToastContainer } from '@/utils/toast.tsx';
import { initializeMenuRegistry } from '@/components/menu/MenuRegistry';

// Import your existing components - FIXED: Use GameGUI instead of non-existent GameScreen
import GameGUI from '@/components/GameGUI';

function App() {
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
      <GameProvider>
        <MenuProvider>
          <div className="App">
            <GameGUI />
            <MenuHost />
            <ToastContainer position="top" />
          </div>
        </MenuProvider>
      </GameProvider>
    </Router>
  );
}

export default App;
