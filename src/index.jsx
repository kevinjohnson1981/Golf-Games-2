import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Connects App.jsx as main app
import './styles.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
