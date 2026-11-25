import { createRoot, hydrateRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App, { preloadRouteComponent } from './App.tsx';
import { getCurrentPath } from './lib/router';
import { notifySwUpdateAvailable } from './lib/pwa';
import './index.css';

let userApprovedRefresh = false;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    notifySwUpdateAvailable(async () => {
      userApprovedRefresh = true;
      await updateSW(true);
    });
  },
  onNeedReload() {
    if (userApprovedRefresh) {
      window.location.reload();
    }
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
