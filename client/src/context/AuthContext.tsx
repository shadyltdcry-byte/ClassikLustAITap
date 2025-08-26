import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeAuth, 3000);
    return () => clearTimeout(timer);
  }, []);

  const login = (userIdFromAuth: string, userData?: any) => {
    console.log('AuthContext: Logging in user:', userIdFromAuth);
    localStorage.setItem('telegram_user_id', userIdFromAuth);
    if (userData?.token) {
      localStorage.setItem('telegram_auth_token', userData.token);
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