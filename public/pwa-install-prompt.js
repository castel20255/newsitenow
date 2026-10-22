(() => {
  const appWindow = window;
  appWindow.__cryptoBinaryInstallPrompt = appWindow.__cryptoBinaryInstallPrompt ?? null;

  appWindow.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    appWindow.__cryptoBinaryInstallPrompt = event;
    appWindow.dispatchEvent(new Event('crypto-binary-install-prompt-ready'));
  });

  appWindow.addEventListener('appinstalled', () => {
    appWindow.__cryptoBinaryInstallPrompt = null;
  });

  if ('serviceWorker' in navigator && appWindow.isSecureContext) {
    void navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();