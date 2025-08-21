
import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GameGUI from "@/components/GameGUI";
import AdminMenu from "@/plugins/admin/AdminMenu";
import NotFound from "@/pages/not-found";
import { GameProvider } from "@/context/GameProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { useEffect, useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameGUI} />
      <Route path="/AdminMenu" component={AdminMenu} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for existing authentication
        const token = localStorage.getItem('telegram_auth_token');
        const storedUserId = localStorage.getItem('telegram_user_id');

        if (token && storedUserId) {
          setUserId(storedUserId);
          setIsAuthenticated(true);
        } else {
          // Try guest mode by default
          const guestId = localStorage.getItem('guest_user_id') || `guest_${Date.now()}`;
          localStorage.setItem('guest_user_id', guestId);
          setUserId(guestId);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        // Fall back to guest mode
        const guestId = `guest_${Date.now()}`;
        localStorage.setItem('guest_user_id', guestId);
        setUserId(guestId);
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Shorter loading time for better UX
    const timer = setTimeout(initializeApp, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userIdFromAuth: string, userData?: any) => {
    localStorage.setItem('telegram_user_id', userIdFromAuth);
    if (userData?.token) {
      localStorage.setItem('telegram_auth_token', userData.token);
    }
    setUserId(userIdFromAuth);
    setIsAuthenticated(true);
  };

  const handleGuestLogin = () => {
    const guestId = `guest_${Date.now()}`;
    localStorage.setItem('guest_user_id', guestId);
    setUserId(guestId);
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <Router />
          <Toaster />
        </GameProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
