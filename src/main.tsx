import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Only the browser version installs an offline shell; document contents stay in local storage.
if ("serviceWorker" in navigator) {
  import("@capacitor/core").then(({ Capacitor }) => {
    if (!Capacitor.isNativePlatform() && import.meta.env.PROD)
      navigator.serviceWorker
        .register(new URL("sw.js", document.baseURI))
        .catch(() => {});
  });
}
