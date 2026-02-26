import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { auth } from './auth.js'
import { cloud } from './cloud.js'
import { useStore } from './store.js'

// ── Boot: Initialize Netlify Identity and cloud sync ──────────────────
auth.init(async (user) => {
  // Broadcast auth change so AuthBar and other components can react
  window.dispatchEvent(new CustomEvent('gp_auth_change', { detail: user }));

  if (user) {
    // User just logged in — pull their data from Netlify Blobs
    const remoteData = await cloud.pull();
    if (remoteData) {
      useStore.getState().syncFromCloud(remoteData);
    }
  }
});

// Final push before the tab closes (best-effort)
window.addEventListener('beforeunload', () => {
  cloud.push();
});


class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "white", background: "#333", height: "100vh", fontFamily: "monospace" }}>
          <h1>💥 Something went wrong.</h1>
          <p>Please send this error to support:</p>
          <pre style={{ color: "red", background: "black", padding: 10 }}>
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GlobalErrorBoundary>
  </React.StrictMode>,
)
