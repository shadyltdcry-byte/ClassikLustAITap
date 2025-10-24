/**
 * BaseMenu.tsx - Universal Menu Template (CONSISTENT BEHAVIOR!)
 * Last Edited: 2025-10-24 by Assistant - Focus trap, scroll lock, ARIA compliance
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import { MenuBackdrop, MenuContainer } from './MenuHost';

export interface BaseMenuProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  
  // Customization
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  clickBackdropToClose?: boolean;
  
  // Header customization
  headerActions?: ReactNode;
  headerClassName?: string;
  
  // Content customization
  contentClassName?: string;
  footerActions?: ReactNode;
  
  // Loading state
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * 🎯 BASE MENU - UNIVERSAL MENU TEMPLATE
 * ALL menus use this for consistent behavior!
 * 
 * Features:
 * - Focus trap (accessibility)
 * - Proper ARIA attributes
 * - Escape key handling
 * - Backdrop click to close
 * - Loading states
 * - Header/footer slots
 * - Responsive sizing
 * - Scroll management
 */
export function BaseMenu({
  title,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  showBackButton = false,
  onBack,
  clickBackdropToClose = true,
  headerActions,
  headerClassName = '',
  contentClassName = '',
  footerActions,
  isLoading = false,
  loadingText = 'Loading...'
}: BaseMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Focus management
  useEffect(() => {
    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Focus the menu container
    if (menuRef.current) {
      menuRef.current.focus();
    }
    
    return () => {
      // Restore focus when menu closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);
  
  // Focus trap within menu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = menuRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey) {
          // Shift+Tab - if on first element, go to last
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab - if on last element, go to first
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    }
  };
  
  return (
    <>
      {/* Backdrop */}
      <MenuBackdrop 
        onClose={clickBackdropToClose ? onClose : () => {}}
        clickToClose={clickBackdropToClose}
      />
      
      {/* Menu Container */}
      <MenuContainer size={size}>
        <div
          ref={menuRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-title"
          onKeyDown={handleKeyDown}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className={`
            flex items-center justify-between 
            p-4 border-b border-gray-700
            bg-gray-800
            ${headerClassName}
          `}>
            <div className="flex items-center space-x-3">
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  aria-label="Go back"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              <h2 
                id="menu-title" 
                className="text-lg font-semibold text-white"
              >
                {title}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {headerActions}
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className={`
            flex-1 overflow-y-auto
            bg-gray-900
            ${contentClassName}
          `}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                  <p className="text-gray-400">{loadingText}</p>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
          
          {/* Footer */}
          {footerActions && (
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              {footerActions}
            </div>
          )}
        </div>
      </MenuContainer>
    </>
  );
}

/**
 * 🎯 MENU LOADING OVERLAY
 * For async operations within menus
 */
export function MenuLoadingOverlay({ 
  text = 'Loading...', 
  show = false 
}: { 
  text?: string;
  show: boolean;
}) {
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
        <p className="text-white">{text}</p>
      </div>
    </div>
  );
}

/**
 * 🎯 MENU SECTION
 * Consistent spacing for menu content sections
 */
export function MenuSection({ 
  title, 
  children, 
  className = "",
  titleClassName = ""
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={`p-4 ${className}`}>
      {title && (
        <h3 className={`text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider ${titleClassName}`}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/**
 * 🎯 MENU ITEM
 * Consistent styling for clickable menu items
 */
export function MenuItem({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'default',
  className = ""
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  className?: string;
}) {
  const variantClasses = {
    default: 'hover:bg-gray-700 text-gray-200',
    primary: 'hover:bg-blue-600 text-blue-200 bg-blue-700/20',
    success: 'hover:bg-green-600 text-green-200 bg-green-700/20',
    danger: 'hover:bg-red-600 text-red-200 bg-red-700/20'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-3 rounded-lg text-left transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default BaseMenu;