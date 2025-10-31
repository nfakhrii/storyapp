let deferredPrompt;
const btn = document.getElementById('btnInstall');

function isStandalone() {
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = window.navigator.standalone === true;
  return displayStandalone || iosStandalone;
}

function updateInstallUI() {
  if (!btn) return;

  if (isStandalone()) {
    btn.classList.add('hidden');
    btn.setAttribute('aria-hidden', 'true');
    btn.disabled = true;
    return;
  }

  const canPrompt = !!deferredPrompt;
  if (canPrompt) {
    btn.classList.remove('hidden');
    btn.setAttribute('aria-hidden', 'false');
    btn.disabled = false;
  } else {
    btn.classList.add('hidden');
    btn.setAttribute('aria-hidden', 'true');
    btn.disabled = true;
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('BeforeInstallPromptEvent fired');
  e.preventDefault();
  deferredPrompt = e;
  updateInstallUI();
});

if (btn) {
  btn.addEventListener('click', async () => {
    try {
      if (!deferredPrompt) {
        console.log('No deferred prompt available');
        return;
      }
      
      console.log('Showing install prompt');
      btn.disabled = true;
      btn.textContent = 'Installing...';
      
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      deferredPrompt = null;
      updateInstallUI();
      if (btn) {
        btn.textContent = 'Install App';
      }
    }
  });
}

window.addEventListener('appinstalled', () => {
  console.log('App was successfully installed');
  deferredPrompt = null;
  updateInstallUI();
});

window.addEventListener('DOMContentLoaded', updateInstallUI);

if (window.matchMedia('(display-mode: standalone)').addEventListener) {
  window.matchMedia('(display-mode: standalone)').addEventListener('change', updateInstallUI);
}

if (!window.matchMedia('(display-mode: standalone)').addEventListener && 
    window.matchMedia('(display-mode: standalone)').addListener) {
  window.matchMedia('(display-mode: standalone)').addListener(updateInstallUI);
}