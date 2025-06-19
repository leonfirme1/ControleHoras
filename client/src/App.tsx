import { useState, useEffect, createContext, useContext } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Services from "@/pages/services";
import Consultants from "@/pages/consultants";
import TimeEntries from "@/pages/time-entries";
import Reports from "@/pages/reports";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

interface AuthUser {
  id: number;
  code: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, logout: () => {} });

export const useAuth = () => useContext(AuthContext);

function Router() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("auth_user");
      }
    }
  }, []);

  const handleLoginSuccess = (consultant: AuthUser) => {
    setUser(consultant);
    localStorage.setItem("auth_user", JSON.stringify(consultant));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/services" component={Services} />
        <Route path="/consultants" component={Consultants} />
        <Route path="/time-entries" component={TimeEntries} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
