/**
 * AQUASHELL — sidebar.js v3.0
 * Inyecta estado del usuario en el sidebar y oculta ítems por rol
 */
import { ROLES } from './auth.js';

export function initSidebar(session) {
  const role = session.rol;

  // Avatar / nombre / badge
  const avatar = document.getElementById('sidebarUserAvatar');
  const name   = document.getElementById('sidebarUserName');
  const badge  = document.getElementById('sidebarUserRole');
  if (avatar) avatar.textContent = (session.nombre || 'U')[0].toUpperCase();
  if (name)   name.textContent   = session.nombre || '—';
  if (badge)  badge.innerHTML    = `<span class="user-role-badge ${ROLES[role]?.color || ''}">${ROLES[role]?.label || role}</span>`;

  // Ocultar ítems de nav según rol
  const hide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };

  if (role === 'operario') {
    hide('navFarms');
    hide('navInputs');
    hide('navReports');
    // navBiometry visible — el operario ejecuta el muestreo físico
  }
  if (role === 'asesor') {
    hide('navFarms');
    hide('navBiometry');
    hide('navInputs');
  }

  // Mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('mainSidebar');
  if (menuBtn && sidebar) menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', e => {
    e.preventDefault(); sessionStorage.clear(); window.location.href = '../index.html';
  });

  // Sync indicator
  const dot   = document.getElementById('syncDot');
  const label = document.getElementById('syncLabel');
  function updateSync() {
    if (!dot || !label) return;
    if (navigator.onLine) { dot.className='sync-dot'; label.textContent='En línea'; }
    else { dot.className='sync-dot offline'; label.textContent='Sin conexión'; }
  }
  updateSync();
  window.addEventListener('online',  updateSync);
  window.addEventListener('offline', updateSync);
}
