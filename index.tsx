
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for preview environment debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Critical Terminal Error:", { message, source, lineno, error });
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Target container 'root' not found in DOM.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
