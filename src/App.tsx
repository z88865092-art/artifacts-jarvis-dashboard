import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

// Sahi import path: setBaseUrl ab custom-fetch.ts se import ho raha hai
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
  useEffect(() => {
    // Vite environment variable se base URL set kar rahe hain
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      setBaseUrl(apiUrl);
      console.log("Base URL successfully set to:", apiUrl);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter
        base={
          import.meta.env.BASE_URL
            ? import.meta.env.BASE_URL.replace(/\/$/, "")
            : ""
        }
      >
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
