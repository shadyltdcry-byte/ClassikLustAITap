import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { deDupeFetch } from '@/lib/queryClient';

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, userData?: any) => void;
  logout: () => void;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing Telegram authentication
        const token = localStorage.getItem('telegram_auth_token');
        const storedUserId = localStorage.getItem('telegram_user_id');

        if (token && storedUserId) {
          setUserId(storedUserId);
          setIsAuthenticated(true);
        } else {
          // Check for guest mode
          const guestId = localStorage.getItem('guest_user_id');
          if (guestId) {
            setUserId(guestId);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        // Completely skip logging empty/meaningless errors
        try {
          const errorStr = JSON.stringify(error);
          const hasContent = error && 
            ((error as any)?.message || 
             (error as any)?.stack || 
             (error as any)?.name ||
             errorStr !== '{}');
          
          if (hasContent) {
            console.error('Auth initialization error:', error);
          } else {
            console.log('[DEBUG] Auth initialization failed - using fallback');
          }
        } catch {
          // If we can't even stringify the error, it's probably not useful
          console.log('[DEBUG] Auth initialization failed - using fallback');
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Check for bot authentication via URL params (from Telegram bot)
    const checkBotAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const telegramId = urlParams.get('telegram_id');
      
      if (telegramId) {
        console.log(`[DEBUG] Found telegram_id in URL: ${telegramId}, checking bot auth status`);
        try {
          const response = await deDupeFetch(`/api/auth/telegram/status/${telegramId}`);
          const data = await response.json();
          
          if (data.authenticated) {
            console.log(`[DEBUG] Bot authentication found for ${telegramId}`, data);
            localStorage.setItem('telegram_auth_token', data.token);
            localStorage.setItem('telegram_user_id', data.user.id);
            localStorage.setItem('telegram_id', telegramId); // Store for future auto-login
            setUserId(data.user.id);
            setIsAuthenticated(true);
            setIsLoading(false);
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } catch (error) {
          // Completely skip logging empty/meaningless errors
          try {
            const errorStr = JSON.stringify(error);
            const hasContent = error && 
              ((error as any)?.message || 
               (error as any)?.stack || 
               (error as any)?.name ||
               errorStr !== '{}');
            
            if (hasContent) {
              console.error('Bot auth check error:', error);
            } else {
              console.log('[DEBUG] Bot auth check failed - proceeding with fallback');
            }
          } catch {
            // If we can't even stringify the error, it's probably not useful
            console.log('[DEBUG] Bot auth check failed - proceeding with fallback');
          }
        }
      } else {
        // No URL param, but check if we have a stored telegram_id from previous login
        const storedTelegramId = localStorage.getItem('telegram_id');
        if (storedTelegramId) {
          console.log(`[DEBUG] No URL param but found stored telegram_id: ${storedTelegramId}, checking auth`);
          try {
            const response = await deDupeFetch(`/api/auth/telegram/status/${storedTelegramId}`);
            const data = await response.json();
            
            if (data.authenticated) {
              console.log(`[DEBUG] Auto-login successful for stored telegram_id: ${storedTelegramId}`);
              localStorage.setItem('telegram_auth_token', data.token);
              localStorage.setItem('telegram_user_id', data.user.id);
              setUserId(data.user.id);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            // Simple error handling without complex logging
            console.log('[DEBUG] Auto-login check failed - proceeding with guest mode');
            // Don't log the actual error to avoid TypeError {} issues
          }
        }
      }
      
      // DISABLED: Fall back auth check to prevent repeated API calls
      // const timer = setTimeout(initializeAuth, 3000);
      // return () => clearTimeout(timer);
    };

    // Await checkBotAuth to ensure errors are properly handled
    checkBotAuth().catch(error => {
      console.error('Auth initialization failed:', error);
      setIsLoading(false);
    });
  }, []);

  // Auto-refresh mechanism to maintain login state - DISABLED TO STOP API SPAM
  // useEffect(() => {
  //   if (!isAuthenticated || isLoading) return;

  //   const autoRefresh = () => {
  //     const token = localStorage.getItem('telegram_auth_token');
  //     const storedUserId = localStorage.getItem('telegram_user_id');
      
  //     if (token && storedUserId) {
  //       // Keep the session alive by refreshing state
  //       console.log('[DEBUG] Auto-refreshing session for:', storedUserId);
  //       setUserId(storedUserId);
  //       setIsAuthenticated(true);
  //     } else {
  //       // Token was cleared, log out
  //       console.log('[DEBUG] Token cleared, logging out');
  //       setIsAuthenticated(false);
  //       setUserId(null);
  //     }
  //   };

  //   // Check every 5 minutes to maintain session
  //   const refreshInterval = setInterval(autoRefresh, 300000);
    
  //   return () => clearInterval(refreshInterval);
  // }, [isAuthenticated, isLoading]);

  const login = (userIdFromAuth: string, userData?: any) => {
    console.log('AuthContext: Logging in user:', userIdFromAuth);
    localStorage.setItem('telegram_user_id', userIdFromAuth);
    if (userData?.token) {
      localStorage.setItem('telegram_auth_token', userData.token);
    }
    
    // Store additional user data for auto-refresh
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
    
    setUserId(userIdFromAuth);
    setIsAuthenticated(true);
  };

  const loginAsGuest = () => {
    // Check if guest user already exists
    let guestId = localStorage.getItem('guest_user_id');
    if (!guestId) {
      guestId = `guest_${Date.now()}`;
      localStorage.setItem('guest_user_id', guestId);
      console.log('AuthContext: Creating new guest user:', guestId);
    } else {
      console.log('AuthContext: Using existing guest user:', guestId);
    }
    setUserId(guestId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('telegram_auth_token');
    localStorage.removeItem('telegram_user_id');
    localStorage.removeItem('guest_user_id');
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      userId,
      isAuthenticated,
      isLoading,
      login,
      logout,
      loginAsGuest
    }}>
      {children}
    </AuthContext.Provider>
  );
};