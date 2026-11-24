import { createRoot, hydrateRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App, { preloadRouteComponent } from './App.tsx';
import { getCurrentPath } from './lib/router';
import './index.css';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Periodically check for updated SW bundles (every 60 minutes)
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    }
  },
});

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

async function mountApp() {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  const ssrRoute = rootEl.getAttribute('data-ssr-route');
  const currentPath = getCurrentPath();

  if (ssrRoute && ssrRoute === currentPath && rootEl.firstElementChild !== null) {
    await preloadRouteComponent(currentPath);
    hydrateRoot(rootEl, <App />);
  } else {
    rootEl.innerHTML = '';
    createRoot(rootEl).render(<App />);
  }
}

void mountApp();
