import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "../lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../components/ui/toaster";
import { TooltipProvider } from "../components/ui/tooltip";
import GameGUI from "../components/GameGUI";
import AdminMenu from "../plugins/admin/AdminMenu";
import NotFound from "./not-found";
import { GameProvider } from "../context/GameProvider";
import { LoadingScreen } from "../components/LoadingScreen";
import { useEffect, useState } from "react";
import { AdminUIToggler } from "../plugins/admin/adminGUI";
import { AuthProvider, useAuth } from "../context/AuthContext";
import TelegramAuth from "../components/TelegramAuth";

// Wrapper component for GameGUI to handle routing
function GameGUIPage() {
  const handlePluginAction = (action: string, data?: any) => {
    console.log('Plugin action:', action, data);
  };

  return <GameGUI onPluginAction={handlePluginAction} />;
}

// Wrapper component for AdminMenu to handle routing  
function AdminMenuPage() {
  return <AdminMenu onClose={() => window.history.back()} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GameGUIPage} />
      <Route path="/game" component={GameGUIPage} />
      <Route path="/AdminMenu" component={AdminMenuPage} />
      <Route path="/admin" component={AdminMenuPage} />
      <Route path="*" component={GameGUIPage} />
    </Switch>
  );
}

function App() {
  // Force clear React Query cache on app start to fix phantom requests
  React.useEffect(() => {
    queryClient.clear();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated, login } = useAuth();
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      // Much faster loading progress
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 25; // Even faster increment
        });
      }, 100); // Much faster interval

      // Emergency fallback - force stop loading after 8 seconds
      const emergencyTimeout = setTimeout(() => {
        console.log('[EMERGENCY] Forcing stop loading after timeout');
        setLoadingProgress(100);
      }, 8000); // Shorter timeout

      return () => {
        clearInterval(interval);
        clearTimeout(emergencyTimeout);
      };
    }
  }, [isLoading]);

  const handleAuthSuccess = (user: any) => {
    console.log('Authentication successful:', user);
    login(user.id, user);
  };

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  if (!isAuthenticated) {
    return <TelegramAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <GameProvider>
      <Router />
      <Toaster />
    </GameProvider>
  );
}

export default App;
