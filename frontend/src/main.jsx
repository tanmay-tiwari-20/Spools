import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary.jsx";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// Global interceptor for expired authentication (HTTP 401)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (!url.includes("/api/users/login") && !url.includes("/api/users/signup")) {
      if (localStorage.getItem("user-spools")) {
        console.warn("Session expired or unauthorized. Clearing local session.");
        localStorage.removeItem("user-spools");
        window.dispatchEvent(new CustomEvent("spools:unauthorized"));
      }
    }
  }
  return response;
};

// Register the PWA service worker with reload trigger on updates
registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <RecoilRoot>
        <ChakraProvider>
          <ThemeProvider>
            <BrowserRouter>
              <SocketContextProvider>
                <App />
              </SocketContextProvider>
            </BrowserRouter>
          </ThemeProvider>
        </ChakraProvider>
      </RecoilRoot>
    </ErrorBoundary>
  </StrictMode>
);