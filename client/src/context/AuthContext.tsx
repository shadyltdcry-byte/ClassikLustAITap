import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { deDupeFetch } from '@/lib/queryClient';

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, userData?: any, token?: string) => void; // Added token param
  logout: () => void;
  loginAsGuest: () => void;
}

// Define a type for the result of checkBotAuth
interface AuthResult {
  success: boolean;
  user?: any; // User object from backend
  token?: string; // Auth token
  error?: string; // Error message
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

  const setUser = (user: any) => {
    setUserId(user.id);
    // Optionally store other user details if needed
    localStorage.setItem('user_data', JSON.stringify(user));
  };

  const checkBotAuth = async (telegramId: string): Promise<AuthResult | null> => {
    try {
      console.log(`[DEBUG] Checking bot auth for telegram_id: ${telegramId}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`/api/auth/telegram/check?telegram_id=${telegramId}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`[DEBUG] Bot auth check failed with status: ${response.status}`);
        return { success: false, error: 'Bot auth check failed' };
      }

      const data = await response.json();
      console.log(`[DEBUG] Bot authentication found for ${telegramId}`, data);

      if (data.authenticated) {
        return { success: true, user: data.user, token: data.token };
      } else {
        return { success: false, error: 'Not authenticated via bot' };
      }
    } catch (error) {
      console.log('Bot auth check error:', error);
      // Don't let network errors cause infinite loading
      return { success: false, error: 'Network error during bot auth check' };
    }
  };

  const attemptAutoLogin = async (): Promise<boolean> => {
    try {
      // First check URL params
      const urlParams = new URLSearchParams(window.location.search);
      const telegramIdFromUrl = urlParams.get('telegram_id');

      if (telegramIdFromUrl) {
        console.log(`[DEBUG] Found telegram_id in URL: ${telegramIdFromUrl}, checking bot auth status`);
        const result = await checkBotAuth(telegramIdFromUrl);

        if (result?.success && result.user && result.token) {
          // Store for future use
          localStorage.setItem('telegram_id', telegramIdFromUrl);
          setUser(result.user);
          setIsAuthenticated(true);
          console.log(`[DEBUG] URL-based login successful for telegram_id: ${telegramIdFromUrl}`);
          return true;
        } else if (result?.error) {
          console.error(`[DEBUG] URL auth check error for ${telegramIdFromUrl}: ${result.error}`);
        }
      }

      // Check stored telegram_id
      const storedTelegramId = localStorage.getItem('telegram_id');
      if (storedTelegramId && storedTelegramId !== telegramIdFromUrl) {
        console.log(`[DEBUG] No URL param but found stored telegram_id: ${storedTelegramId}, checking auth`);

        const result = await checkBotAuth(storedTelegramId);
        if (result?.success && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
          console.log(`[DEBUG] Auto-login successful for stored telegram_id: ${storedTelegramId}`);
          return true;
        } else {
          console.log(`[DEBUG] Auto-login failed for stored telegram_id: ${storedTelegramId}, clearing storage`);
          localStorage.removeItem('telegram_id');
        }
      }

      return false;
    } catch (error) {
      console.log('Auto-login check error:', error);
      // Clear any stored data that might be causing issues
      localStorage.removeItem('telegram_id');
      return false;
    }
  };

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent the default behavior
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const telegramIdFromUrl = urlParams.get('telegram_id');

        if (telegramIdFromUrl) {
          console.log(`[DEBUG] Found telegram_id in URL: ${telegramIdFromUrl}, checking bot auth status`);
          try {
            const authData = await checkBotAuth(telegramIdFromUrl);

            if (authData?.success && authData.user && authData.token) {
              login(authData.user.id, authData.user, authData.token);
              localStorage.setItem('telegram_id', telegramIdFromUrl);
              return;
            } else if (authData?.error) {
              console.error(`[DEBUG] URL auth check error for ${telegramIdFromUrl}: ${authData.error}`);
            }
          } catch (error) {
            console.error('URL auth check failed:', error);
          }
        }

        // Check stored telegram_id
        const storedTelegramId = localStorage.getItem('telegram_id');
        if (storedTelegramId) {
          console.log(`[DEBUG] No URL param but found stored telegram_id: ${storedTelegramId}, checking auth`);
          try {
            const authData = await checkBotAuth(storedTelegramId);

            if (authData?.success && authData.user) {
              console.log(`[DEBUG] Auto-login successful for stored telegram_id: ${storedTelegramId}`);
              login(authData.user.id, authData.user, authData.token);
              return;
            } else {
              console.log(`[DEBUG] Auto-login failed for stored telegram_id: ${storedTelegramId}`);
              localStorage.removeItem('telegram_id');
            }
          } catch (error) {
            console.error('Stored auth check failed:', error);
            localStorage.removeItem('telegram_id');
          }
        }

        console.log('[DEBUG] No valid authentication found, showing auth screen');
      } catch (error) {
        console.error('Auto-login check error:', error);
        localStorage.removeItem('telegram_id');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);


  const login = (userIdFromAuth: string, userData?: any, token?: string) => {
    console.log('AuthContext: Logging in user:', userIdFromAuth);
    localStorage.setItem('telegram_user_id', userIdFromAuth);
    if (token) { // Use the token param directly
      localStorage.setItem('telegram_auth_token', token);
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
    localStorage.removeItem('telegram_id'); // Also remove telegram_id
    localStorage.removeItem('user_data'); // Also remove user data
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