import { Switch, Route, Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
// Import hash location hook
import { useHashLocation } from "wouter/use-hash-location";

import { setBaseUrl } from "@/lib/api-client/custom-fetch";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Tasks from "@/pages/Tasks";
import Systems from "@/pages/Systems";
import Settings from "@/pages/Settings";
import VoiceTone from "@/pages/VoiceTone";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function RouterContent() {
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
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) setBaseUrl(apiUrl);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* HashLocation use karne se Vercel par routes click karne par foran switch honge */}
      <Router hook={useHashLocation}>
        <RouterContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
