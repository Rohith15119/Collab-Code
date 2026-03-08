import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

window.addEventListener("unhandledrejection", (event) => {
  if (event.reason?.type === "cancelation") {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Analytics />
    </AuthProvider>
  </StrictMode>,
);
