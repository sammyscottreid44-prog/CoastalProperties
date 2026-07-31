import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "./admin/AdminApp";
import App from "./App";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const isAdmin = path === "/admin";

createRoot(root).render(
  <StrictMode>
    {isAdmin ? <AdminApp /> : <App />}
  </StrictMode>,
);
