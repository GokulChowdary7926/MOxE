import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from '../store';

export default function AppBootstrap() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

export function mountApp() {
  const root = document.getElementById('root');
  if (!root) return;
  try {
    ReactDOM.createRoot(root).render(<AppBootstrap />);
  } catch (err) {
    root.innerHTML =
      '<div style="padding:1.5rem;font-family:system-ui;color:#fff;background:#1a1a2e;min-height:100vh;"><p><strong>App failed to start</strong></p><p>Check the browser console and ensure the backend is running (e.g. <code>npm run dev</code> in BACKEND).</p></div>';
    console.error('MOxE bootstrap error:', err);
  }
}
