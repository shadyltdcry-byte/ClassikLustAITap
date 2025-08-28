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
    const initializeAuth = () => {
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
          const response = await deDupeFetch(`/api/auth/telegram/status/${telegramId}`).catch(() => null);
          
          if (response && response.ok) {
            const data = await response.json().catch(() => null);
            
            if (data && data.authenticated) {
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
          }
        } catch (error) {
          console.log('[DEBUG] Bot auth check failed, using stored credentials');
        }
      }
      
      // If no URL auth or it failed, just use stored credentials immediately
      if (!authChecked) {
        console.log('[DEBUG] Using stored credentials for faster login');
        initializeAuth();
        authChecked = true;
      }
    };

    // Set a much shorter maximum loading time to prevent infinite loading
    const maxLoadingTimer = setTimeout(() => {
      console.log('[DEBUG] Max loading time reached (3s), forcing login');
      if (isLoading) {
        // Force login with existing credentials or guest mode
        const storedUserId = localStorage.getItem('telegram_user_id');
        const guestId = localStorage.getItem('guest_user_id');
        
        if (storedUserId) {
          setUserId(storedUserId);
          setIsAuthenticated(true);
        } else if (guestId) {
          setUserId(guestId);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      }
    }, 3000); // Reduced to 3 seconds

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