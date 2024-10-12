import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration.js"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RecoilRoot>
      <ChakraProvider>
        <BrowserRouter>
          <SocketContextProvider>
            <App />
          </SocketContextProvider>
        </BrowserRouter>
      </ChakraProvider>
    </RecoilRoot>
  </StrictMode>
);

// Register service worker for PWA capabilities.
serviceWorkerRegistration.register();