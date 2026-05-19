import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import ShopsPage from "@/pages/shops";
import UsersPage from "@/pages/users";
import OrdersPage from "@/pages/orders";
import CategoriesPage from "@/pages/categories";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Switch>
      <Route path="/auth">
        {() => {
           if (isLoading) return null;
           if (user) {
             setLocation("/dashboard");
             return null;
           }
           return <AuthPage />;
        }}
      </Route>
      <Route path="/" component={() => {
         if (isLoading) return null;
         if (user) setLocation("/dashboard");
         else setLocation("/auth");
         return null;
      }} />
      <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
      <Route path="/shops"><ProtectedRoute component={ShopsPage} /></Route>
      <Route path="/users"><ProtectedRoute component={UsersPage} /></Route>
      <Route path="/orders"><ProtectedRoute component={OrdersPage} /></Route>
      <Route path="/categories"><ProtectedRoute component={CategoriesPage} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
