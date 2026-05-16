// CRA scaffolded a service-worker register/unregister helper here. The app
// has never actually shipped a service worker, and `register()` was always
// commented out at the call site. Keep only `unregister()` so the original
// import in main.jsx continues to clear any stale registration on load.

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
