import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// PWA: Service Worker Register karna taake offline access mile
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) =>
        console.log("Jarvis PWA Service Worker registered:", reg.scope),
      )
      .catch((err) => console.log("Service Worker registration failed:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
