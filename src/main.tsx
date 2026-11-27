import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/lexend";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/auth.css";
import App from "./App";
import { StartupSplash } from "./components/StartupSplash";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <StartupSplash>
        <App />
      </StartupSplash>
    </AppErrorBoundary>
  </StrictMode>,
);
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  let reloadingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        // Download actions still surface their own errors; do not claim an offline shell.
        window.dispatchEvent(new Event("skillup:offline-unavailable"));
      });
  });
}
