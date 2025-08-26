import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GameGUI from "@/components/GameGUI";
import AdminMenu from "@/plugins/admin/AdminMenu";
import NotFound from "@/pages/not-found";
import { GameProvider } from "@/context/GameProvider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import LoginScreen from "@/components/LoginScreen";
import { AdminUIToggler } from "@/plugins/admin/adminGUI";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <GameGUI onPluginAction={() => {}} />} />
      <Route path="/AdminMenu" component={() => <AdminMenu onClose={() => {}} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated, login, loginAsGuest } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} onGuestLogin={loginAsGuest} />;
  }

  return (
    <GameProvider>
      <Router />
      <Toaster />
    </GameProvider>
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

export default App;
