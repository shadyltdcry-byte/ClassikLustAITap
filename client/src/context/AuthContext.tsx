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
          console.log('[DEBUG] Found stored credentials, logging in as:', storedUserId);
          setUserId(storedUserId);
          setIsAuthenticated(true);
        } else {
          // Check for guest mode
          const guestId = localStorage.getItem('guest_user_id');
          if (guestId) {
            console.log('[DEBUG] Found guest ID, logging in as guest:', guestId);
            setUserId(guestId);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check for bot authentication via URL params (from Telegram bot)
    const checkBotAuth = async () => {
      let authChecked = false;
      
      const urlParams = new URLSearchParams(window.location.search);
      const telegramId = urlParams.get('telegram_id');
      
      if (telegramId) {
        console.log(`[DEBUG] Found telegram_id in URL: ${telegramId}, checking bot auth status`);
        try {
          const response = await deDupeFetch(`/api/auth/telegram/status/${telegramId}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.authenticated) {
            console.log(`[DEBUG] Bot authentication found for ${telegramId}`, data);
            localStorage.setItem('telegram_auth_token', data.token);
            localStorage.setItem('telegram_user_id', data.user.id);
            localStorage.setItem('telegram_id', telegramId);
            setUserId(data.user.id);
            setIsAuthenticated(true);
            setIsLoading(false);
            authChecked = true;
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } catch (error) {
          console.error('Bot auth check error:', error);
          // Continue to fallback auth
        }
      }
      
      // Only check stored telegram_id if we haven't already authenticated
      if (!authChecked) {
        const storedTelegramId = localStorage.getItem('telegram_id');
        if (storedTelegramId) {
          console.log(`[DEBUG] Found stored telegram_id: ${storedTelegramId}, attempting auto-login`);
          try {
            const response = await deDupeFetch(`/api/auth/telegram/status/${storedTelegramId}`);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.authenticated) {
              console.log(`[DEBUG] Auto-login successful for stored telegram_id: ${storedTelegramId}`);
              localStorage.setItem('telegram_auth_token', data.token);
              localStorage.setItem('telegram_user_id', data.user.id);
              setUserId(data.user.id);
              setIsAuthenticated(true);
              setIsLoading(false);
              authChecked = true;
              return;
            }
          } catch (error) {
            console.error('Auto-login check error:', error);
            // Clear invalid stored telegram_id to prevent future attempts
            localStorage.removeItem('telegram_id');
          }
        }
      }
      
      // If no URL param and no valid stored auth, use normal initialization with timeout
      if (!authChecked) {
        console.log('[DEBUG] No valid auth found, initializing normally');
        setTimeout(initializeAuth, 1500); // Reduced timeout
      }
    };

    // Set a maximum loading time to prevent infinite loading
    const maxLoadingTimer = setTimeout(() => {
      console.log('[DEBUG] Max loading time reached, forcing auth check');
      if (isLoading) {
        setIsLoading(false);
      }
    }, 8000); // 8 second maximum

    checkBotAuth();
    
    return () => clearTimeout(maxLoadingTimer);
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