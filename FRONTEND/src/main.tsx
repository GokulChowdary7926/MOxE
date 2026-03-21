import React from 'react';
import ReactDOM from 'react-dom/client';

const root = document.getElementById('root');
if (root) {
  // Load app in a separate chunk so the entry stays minimal and is less likely to hit server transform errors
  import('./AppBootstrap')
    .then((m) => m.mountApp())
    .catch((err) => {
      root.innerHTML =
        '<div style="padding:1.5rem;font-family:system-ui;color:#fff;background:#1a1a2e;min-height:100vh;"><p><strong>Failed to load app</strong></p><p>If the server returned 500, check the terminal where you ran <code>npm run dev</code> for errors. Ensure the backend is running on port 5007 if the app calls the API.</p></div>';
      console.error('MOxE load error:', err);
    });
}
