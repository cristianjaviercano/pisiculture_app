/**
 * AQUASHELL — sidebar.js v3.0
 * Renders sidebar and handles offline detection
 */
import { clearSession } from './auth.js';

export function injectSidebar() {
  const tpl = document.getElementById('sidebarTemplate');
  if (!tpl) return;
  document.body.insertBefore(tpl.content.cloneNode(true), document.body.firstChild);

  // Mobile toggle
  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('mainSidebar');
  if (btn && sidebar) btn.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSession();
    window.location.href = '../index.html';
  });

  // Online/offline indicator
  function updateSync() {
    const dot   = document.getElementById('syncDot');
    const label = document.getElementById('syncLabel');
    if (!dot || !label) return;
    if (navigator.onLine) {
      dot.className   = 'sync-dot';
      label.textContent = 'En línea';
    } else {
      dot.className   = 'sync-dot offline';
      label.textContent = 'Sin conexión';
    }
  }
  updateSync();
  window.addEventListener('online',  updateSync);
  window.addEventListener('offline', updateSync);
}
