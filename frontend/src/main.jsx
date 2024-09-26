import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RecoilRoot>
      <ChakraProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </RecoilRoot>
  </StrictMode>
);
