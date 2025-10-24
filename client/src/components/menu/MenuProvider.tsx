/**
 * MenuProvider.tsx - Global Menu State Management (NO MORE Z-INDEX HELL!)
 * Last Edited: 2025-10-24 by Assistant - Stack-based menu system for sanity
 */

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

export interface MenuState {
  menuId: string;
  props?: Record<string, any>;
  timestamp: number;
}

export interface MenuContextValue {
  stack: MenuState[];
  currentMenu: MenuState | null;
  open: (menuId: string, props?: Record<string, any>) => void;
  replace: (menuId: string, props?: Record<string, any>) => void;
  close: () => void;
  closeAll: () => void;
  isOpen: (menuId?: string) => boolean;
}

type MenuAction = 
  | { type: 'OPEN'; menuId: string; props?: Record<string, any> }
  | { type: 'REPLACE'; menuId: string; props?: Record<string, any> }
  | { type: 'CLOSE' }
  | { type: 'CLOSE_ALL' };

const MenuContext = createContext<MenuContextValue | null>(null);

/**
 * 🎯 MENU REDUCER - SINGLE SOURCE OF TRUTH
 * No more scattered boolean state across components!
 */
function menuReducer(state: MenuState[], action: MenuAction): MenuState[] {
  const timestamp = Date.now();
  
  switch (action.type) {
    case 'OPEN':
      // Push new menu to stack
      return [...state, { 
        menuId: action.menuId, 
        props: action.props, 
        timestamp 
      }];
      
    case 'REPLACE':
      // Replace top of stack (or open if empty)
      if (state.length === 0) {
        return [{ menuId: action.menuId, props: action.props, timestamp }];
      }
      
      return [...state.slice(0, -1), { 
        menuId: action.menuId, 
        props: action.props, 
        timestamp 
      }];
      
    case 'CLOSE':
      // Pop top menu from stack
      return state.slice(0, -1);
      
    case 'CLOSE_ALL':
      // Clear entire stack
      return [];
      
    default:
      return state;
  }
}

interface MenuProviderProps {
  children: ReactNode;
}

/**
 * 🎮 MENU PROVIDER - GLOBAL MENU STATE
 * Wrap your entire app with this!
 */
export function MenuProvider({ children }: MenuProviderProps) {
  const [stack, dispatch] = useReducer(menuReducer, []);
  
  const open = useCallback((menuId: string, props?: Record<string, any>) => {
    console.log(`🎯 [MENU] Opening: ${menuId}`, props);
    dispatch({ type: 'OPEN', menuId, props });
  }, []);
  
  const replace = useCallback((menuId: string, props?: Record<string, any>) => {
    console.log(`🔄 [MENU] Replacing with: ${menuId}`, props);
    dispatch({ type: 'REPLACE', menuId, props });
  }, []);
  
  const close = useCallback(() => {
    const current = stack[stack.length - 1];
    if (current) {
      console.log(`❌ [MENU] Closing: ${current.menuId}`);
    }
    dispatch({ type: 'CLOSE' });
  }, [stack]);
  
  const closeAll = useCallback(() => {
    console.log(`❌ [MENU] Closing all menus`);
    dispatch({ type: 'CLOSE_ALL' });
  }, []);
  
  const isOpen = useCallback((menuId?: string) => {
    if (!menuId) return stack.length > 0;
    return stack.some(menu => menu.menuId === menuId);
  }, [stack]);
  
  const currentMenu = stack[stack.length - 1] || null;
  
  const contextValue: MenuContextValue = {
    stack,
    currentMenu,
    open,
    replace,
    close,
    closeAll,
    isOpen
  };
  
  return (
    <MenuContext.Provider value={contextValue}>
      {children}
    </MenuContext.Provider>
  );
}

/**
 * 🎯 USE MENU HOOK - CLEAN API FOR COMPONENTS
 * No more scattered state management!
 */
export function useMenu(): MenuContextValue {
  const context = useContext(MenuContext);
  
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  
  return context;
}

/**
 * 🎯 MENU REGISTRATION SYSTEM
 * Add menus without touching layout code!
 */
export type MenuComponent = React.ComponentType<{
  props?: Record<string, any>;
  onClose: () => void;
  onReplace: (menuId: string, props?: Record<string, any>) => void;
}>;

class MenuRegistry {
  private static instance: MenuRegistry;
  private menus = new Map<string, MenuComponent>();
  
  static getInstance(): MenuRegistry {
    if (!MenuRegistry.instance) {
      MenuRegistry.instance = new MenuRegistry();
    }
    return MenuRegistry.instance;
  }
  
  /**
   * 📝 REGISTER A MENU COMPONENT
   */
  register(menuId: string, component: MenuComponent): void {
    this.menus.set(menuId, component);
    console.log(`📝 [MENU] Registered: ${menuId}`);
  }
  
  /**
   * 🔍 GET MENU COMPONENT
   */
  get(menuId: string): MenuComponent | null {
    return this.menus.get(menuId) || null;
  }
  
  /**
   * 📋 LIST ALL REGISTERED MENUS
   */
  list(): string[] {
    return Array.from(this.menus.keys());
  }
  
  /**
   * 🗑️ UNREGISTER MENU (CLEANUP)
   */
  unregister(menuId: string): void {
    this.menus.delete(menuId);
    console.log(`🗑️ [MENU] Unregistered: ${menuId}`);
  }
}

export const menuRegistry = MenuRegistry.getInstance();

/**
 * 🎯 HELPER FUNCTION TO REGISTER MENUS
 */
export function registerMenu(menuId: string, component: MenuComponent): void {
  menuRegistry.register(menuId, component);
}

/**
 * 🎯 MENU IDs - CENTRALIZED CONSTANTS
 * No more string typos across components!
 */
export const MENU_IDS = {
  UPGRADES: 'upgrades',
  TASKS: 'tasks', 
  CHARACTER: 'character',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements',
  SHOP: 'shop',
  PASSIVE: 'passive',
  INVENTORY: 'inventory',
  LEADERBOARD: 'leaderboard',
  ADMIN: 'admin'
} as const;

export type MenuId = typeof MENU_IDS[keyof typeof MENU_IDS];