import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";

// Suppress a noisy React DevTools suggestion message in development console
// (e.g. "Download the React DevTools for a better development experience")
// This is harmless but can clutter the devtools; we only filter it in DEV.
if (import.meta.env.DEV) {
  const _info = console.info.bind(console);
  console.info = (...args) => {
    try {
      const first = args[0];
      if (typeof first === "string" && first.includes("Download the React DevTools")) {
        return; // swallow this specific message
      }
    } catch (e) {
      // fall through to original
    }
    _info(...args);
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
