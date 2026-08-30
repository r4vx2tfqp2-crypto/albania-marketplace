import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './i18n/index.js'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker } from './lib/push.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)

// Registering the service worker doesn't itself request notification
// permission or ask for anything -- it just makes the app installable
// and offline-shell-capable (manifest.json + sw.js's fetch handler).
// Actually subscribing to push happens later, only from an explicit
// user action (the Settings toggle -- see client/src/lib/push.js).
registerServiceWorker();