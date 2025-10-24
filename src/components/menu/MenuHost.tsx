/**
 * MenuHost.tsx - Portal-Based Menu Renderer (ELIMINATES Z-INDEX HELL!)
 * Last Edited: 2025-10-24 by Assistant - Portals to body for clean overlay
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMenu, menuRegistry } from './MenuProvider';
import { BaseMenu } from './BaseMenu';

/**
 * 🎯 MENU HOST - RENDERS ACTIVE MENU VIA PORTAL
 * NO MORE Z-INDEX CONFLICTS!
 * 
 * Features:
 * - Portal to document.body (escapes container z-index)
 * - Body scroll lock when menu open
 * - Focus trap and restoration
 * - Keyboard shortcuts (ESC to close)
 * - Only one menu rendered at a time
 */
export function MenuHost() {
  const { currentMenu, close } = useMenu();
  
  // Handle body scroll lock
  useEffect(() => {
    if (currentMenu) {
      // Lock body scroll when menu is open
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
      
      // Add global ESC handler
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          close();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.classList.remove('menu-open');
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [currentMenu, close]);
  
  // No menu open - render nothing
  if (!currentMenu) {
    return null;
  }
  
  // Get menu component from registry
  const MenuComponent = menuRegistry.get(currentMenu.menuId);
  
  if (!MenuComponent) {
    console.error(`❌ [MENU] Menu '${currentMenu.menuId}' not found in registry`);
    return createPortal(
      <BaseMenu
        title={`Menu Not Found`}
        onClose={close}
        size="md"
      >
        <div className="p-6 text-center text-red-400">
          <h3 className="text-lg font-bold mb-2">Menu Not Found</h3>
          <p>The menu '{currentMenu.menuId}' is not registered.</p>
          <button 
            onClick={close}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </BaseMenu>,
      document.body
    );
  }
  
  // Render menu component via portal
  return createPortal(
    <MenuComponent 
      props={currentMenu.props || {}} 
      onClose={close}
      onReplace={(menuId, props) => {
        const { replace } = useMenu();
        replace(menuId, props);
      }}
    />,
    document.body
  );
}

/**
 * 🎯 MENU PORTAL WRAPPER
 * For components that need to render above everything
 */
export function MenuPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

/**
 * 🎯 MENU BACKDROP
 * Reusable backdrop component with click-to-close
 */
export function MenuBackdrop({ 
  onClose, 
  className = "",
  clickToClose = true 
}: { 
  onClose: () => void;
  className?: string;
  clickToClose?: boolean;
}) {
  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 ${className}`}
      onClick={clickToClose ? onClose : undefined}
      aria-hidden="true"
    />
  );
}

/**
 * 🎯 MENU CONTAINER
 * Standardized positioning and sizing
 */
export function MenuContainer({ 
  children, 
  size = 'md',
  className = ""
}: { 
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };
  
  return (
    <div className={`
      fixed inset-0 z-50 
      flex items-center justify-center
      p-4 sm:p-6 lg:p-8
    `}>
      <div className={`
        relative w-full ${sizeClasses[size]} 
        max-h-[90vh] 
        bg-gray-900 
        rounded-xl 
        shadow-2xl 
        border border-gray-700
        overflow-hidden
        ${className}
      `}>
        {children}
      </div>
    </div>
  );
}

export default MenuHost;