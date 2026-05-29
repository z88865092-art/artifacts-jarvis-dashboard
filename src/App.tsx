import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { setBaseUrl } from "@/lib/api";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Tasks from "@/pages/Tasks";
import Systems from "@/pages/Systems";
import Settings from "@/pages/Settings";
import VoiceTone from "@/pages/VoiceTone";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/systems" component={Systems} />
        <Route path="/voice" component={VoiceTone} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // یہ حصہ خود بخود Vercel کی Settings سے URL اٹھا لے گا
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      setBaseUrl(apiUrl);
      console.log("Base URL set to:", apiUrl);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
