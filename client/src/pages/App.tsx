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
    // Check for existing authentication
    const token = localStorage.getItem('telegram_auth_token');
    const storedUserId = localStorage.getItem('telegram_user_id');

    if (token && storedUserId) {
      setUserId(storedUserId);
      setIsAuthenticated(true);
    }

    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userIdFromAuth: string, userData?: any) => {
    setUserId(userIdFromAuth);
    setIsAuthenticated(true);
  };

  const handleGuestLogin = () => {
    const guestId = `guest_${Date.now()}`;
    setUserId(guestId);
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoginScreen onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
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