import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js"; 
import { AuthProvider } from "./context/AuthContext.js"; 
import { BrowserRouter as Router } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
