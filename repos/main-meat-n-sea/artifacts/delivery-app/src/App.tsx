import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import JobsPage from "@/pages/jobs";
import MyJobsPage from "@/pages/my-jobs";
import JobDetailPage from "@/pages/job-detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  if (!token) return <Redirect to="/auth" />;
  return <Component />;
}

function Router() {
  const { token } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {token ? <Redirect to="/jobs" /> : <Redirect to="/auth" />}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route path="/jobs">
        <ProtectedRoute component={JobsPage} />
      </Route>
      <Route path="/my-jobs">
        <ProtectedRoute component={MyJobsPage} />
      </Route>
      <Route path="/job/:id">
        <ProtectedRoute component={JobDetailPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
