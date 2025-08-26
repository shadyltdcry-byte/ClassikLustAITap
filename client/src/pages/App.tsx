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
import { useEffect } from "react";
import { AdminUIToggler } from "@/plugins/admin/adminGUI";
import { AuthProvider, useAuth } from "@/context/AuthContext";

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
      <Route path="/AdminMenu" component={AdminMenuPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
  const { isLoading, isAuthenticated, loginAsGuest } = useAuth();

  useEffect(() => {
    // Auto-login as guest if not authenticated
    if (!isLoading && !isAuthenticated) {
      loginAsGuest();
    }
  }, [isLoading, isAuthenticated, loginAsGuest]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <GameProvider>
      <Router />
      <Toaster />
    </GameProvider>
  );
}

export default App;
