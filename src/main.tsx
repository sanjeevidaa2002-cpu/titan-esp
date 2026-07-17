import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign HMR WebSocket errors from bubbling up and triggering unhandled rejection overlays in AI Studio
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    if (
      message.includes('WebSocket') || 
      message.includes('websocket') || 
      message.includes('WebSocket closed')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.includes('WebSocket') || 
      message.includes('websocket') || 
      message.includes('WebSocket closed')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
