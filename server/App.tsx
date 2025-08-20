import { Switch, Route } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GameGUI from "@/components/GameGUI";
import AdminMenu from "@/plugins/admin/AdminMenu";
import NotFound from "@/pages/not-found";
import { GameProvider } from "@/context/GameProvider";

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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <Router />
        </GameProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
