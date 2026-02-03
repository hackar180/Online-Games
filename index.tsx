
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
} catch (error) {
  console.error("Mounting error:", error);
}
