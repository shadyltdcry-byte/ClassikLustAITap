import { useState, useEffect, useRef } from 'react';
import { deDupeFetch } from '@/lib/queryClient';

interface AuthState {
  userId: string | null;
  authSource: 'telegram' | 'supabase' | 'guest' | null;
  sessionAge: number; // in minutes
  lastLoginMethod: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthFlowConfig {
  telegramTimeout: number; // ms to wait for Telegram data
  supabaseTimeout: number; // ms to wait for Supabase session
  allowGuestFallback: boolean;
  debug: boolean;
}

const DEFAULT_CONFIG: AuthFlowConfig = {
  telegramTimeout: 15000, // 15 seconds - longer timeout
  supabaseTimeout: 5000, // 5 seconds  
  allowGuestFallback: false, // No guest mode - auth required
  debug: import.meta.env.DEV
};

export function useAuthFlow(config: Partial<AuthFlowConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const [authState, setAuthState] = useState<AuthState>({
    userId: null,
    authSource: null,
    sessionAge: 0,
    lastLoginMethod: 'none',
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Update session age every minute
  useEffect(() => {
    if (!authState.isAuthenticated) return;
    
    const interval = setInterval(() => {
      const loginTime = localStorage.getItem('login_timestamp');
      if (loginTime) {
        const ageMinutes = Math.floor((Date.now() - parseInt(loginTime)) / 60000);
        setAuthState(prev => ({ ...prev, sessionAge: ageMinutes }));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated]);

  // Centralized auth flow
  useEffect(() => {
    let aborted = false;
    
    const runAuthFlow = async () => {
      if (finalConfig.debug) {
        console.log('[useAuthFlow] Starting centralized auth flow...');
      }

      try {
        // Step 1: Check for Telegram data (with timeout)
        const telegramResult = await Promise.race([
          checkTelegramAuth(),
          new Promise<null>(resolve => 
            setTimeout(() => resolve(null), finalConfig.telegramTimeout)
          )
        ]);

        if (aborted) return;

        if (telegramResult) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Telegram auth successful:', telegramResult);
          }
          updateAuthState(telegramResult);
          return;
        }

        // Step 2: Check Supabase session (with timeout)
        const supabaseResult = await Promise.race([
          checkSupabaseSession(),
          new Promise<null>(resolve => 
            setTimeout(() => resolve(null), finalConfig.supabaseTimeout)
          )
        ]);

        if (aborted) return;

        if (supabaseResult) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Supabase auth successful:', supabaseResult);
          }
          updateAuthState(supabaseResult);
          return;
        }

        // Step 3: No guest fallback - require authentication
        if (finalConfig.debug) {
          console.log('[useAuthFlow] No authentication found, requiring Telegram login');
        }
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication required. Please log in through Telegram to access the game.'
        }));

      } catch (error) {
        if (!aborted) {
          console.error('[useAuthFlow] Auth flow error:', error);
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication failed'
          }));
        }
      }
    };

    runAuthFlow();

    return () => {
      aborted = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Check Telegram authentication
  const checkTelegramAuth = async (): Promise<AuthState | null> => {
    try {
      // Check URL params first
      const urlParams = new URLSearchParams(window.location.search);
      const telegramId = urlParams.get('telegram_id');
      
      if (finalConfig.debug) {
        console.log('[useAuthFlow] Checking URL params:', { telegramId, fullURL: window.location.href });
      }
      
      if (telegramId) {
        if (finalConfig.debug) {
          console.log('[useAuthFlow] Found telegram_id in URL, checking auth status...');
        }
        
        const response = await deDupeFetch(`/api/auth/telegram/status/${telegramId}`);
        
        if (!response.ok) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Telegram auth response not ok:', response.status);
          }
          return null;
        }
        
        const data = await response.json();
        
        if (finalConfig.debug) {
          console.log('[useAuthFlow] Telegram status response:', data);
        }
        
        if (data.authenticated) {
          localStorage.setItem('telegram_auth_token', data.token || 'no-token');
          localStorage.setItem('telegram_user_id', data.user.id);
          localStorage.setItem('telegram_id', telegramId);
          localStorage.setItem('login_timestamp', Date.now().toString());
          
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Telegram auth successful, cleaning URL...');
          }
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          return {
            userId: data.user.id,
            authSource: 'telegram',
            sessionAge: 0,
            lastLoginMethod: 'telegram_url',
            isAuthenticated: true,
            isLoading: false,
            error: null
          };
        }
      }

      // Check stored Telegram data
      const storedToken = localStorage.getItem('telegram_auth_token');
      const storedUserId = localStorage.getItem('telegram_user_id');
      const storedTelegramId = localStorage.getItem('telegram_id');
      
      if (storedToken && storedUserId && storedTelegramId) {
        // Validate stored session
        const response = await deDupeFetch(`/api/auth/telegram/status/${storedTelegramId}`);
        
        if (!response.ok) {
          if (finalConfig.debug) {
            console.log('[useAuthFlow] Stored auth validation failed:', response.status);
          }
          return null;
        }
        
        const data = await response.json();
        
        if (data.authenticated) {
          const loginTime = localStorage.getItem('login_timestamp');
          const sessionAge = loginTime ? 
            Math.floor((Date.now() - parseInt(loginTime)) / 60000) : 0;
          
          return {
            userId: storedUserId,
            authSource: 'telegram',
            sessionAge,
            lastLoginMethod: 'telegram_stored',
            isAuthenticated: true,
            isLoading: false,
            error: null
          };
        }
      }

      return null;
    } catch (error) {
      if (finalConfig.debug) {
        console.error('[useAuthFlow] Telegram auth check error:', error);
      }
      return null;
    }
  };

  // Check Supabase session
  const checkSupabaseSession = async (): Promise<AuthState | null> => {
    // TODO: Implement Supabase session validation
    // For now, return null since we're not using Supabase auth yet
    return null;
  };

  // Create guest session
  const createGuestSession = (): AuthState => {
    let guestId = localStorage.getItem('guest_user_id');
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem('guest_user_id', guestId);
    }
    localStorage.setItem('login_timestamp', Date.now().toString());

    return {
      userId: guestId,
      authSource: 'guest',
      sessionAge: 0,
      lastLoginMethod: 'guest_fallback',
      isAuthenticated: true,
      isLoading: false,
      error: null
    };
  };

  // Update auth state
  const updateAuthState = (newState: AuthState) => {
    if (mountedRef.current) {
      setAuthState(newState);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('telegram_auth_token');
    localStorage.removeItem('telegram_user_id');
    localStorage.removeItem('telegram_id');
    localStorage.removeItem('guest_user_id');
    localStorage.removeItem('login_timestamp');
    
    setAuthState({
      userId: null,
      authSource: null,
      sessionAge: 0,
      lastLoginMethod: 'none',
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };

  // Login function (for external auth success)
  const login = (userId: string, authSource: 'telegram' | 'supabase' | 'guest', userData?: any) => {
    localStorage.setItem('login_timestamp', Date.now().toString());
    
    if (authSource === 'telegram') {
      localStorage.setItem('telegram_user_id', userId);
      if (userData?.token) {
        localStorage.setItem('telegram_auth_token', userData.token);
      }
      if (userData?.telegramId) {
        localStorage.setItem('telegram_id', userData.telegramId);
      }
    } else if (authSource === 'guest') {
      localStorage.setItem('guest_user_id', userId);
    }

    setAuthState({
      userId,
      authSource,
      sessionAge: 0,
      lastLoginMethod: authSource,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  };

  return {
    ...authState,
    login,
    logout,
    config: finalConfig
  };
}