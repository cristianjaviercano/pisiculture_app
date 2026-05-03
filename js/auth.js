/**
 * AQUASHELL — auth.js v3.0
 * Autenticación RBAC simulada — CU-AQUA-01
 */

import { getAll, put, openDB } from './db.js';

const SESSION_KEY = 'aq_session';
const FARM_KEY    = 'aq_active_farm';

export const ROLES = {
  operario:    { label: '🌾 Operario',     nivel: 1, color: 'role-operario' },
  coordinador: { label: '🎯 Coordinador',  nivel: 2, color: 'role-coordinador' },
  gerente:     { label: '📊 Gerente',      nivel: 3, color: 'role-gerente' },
  asesor:      { label: '🔬 Asesor',       nivel: 2, color: 'role-asesor' },
  superadmin:  { label: '⚡ Super Admin',  nivel: 5, color: 'role-superadmin' },
};

export const ROLE_PERMISSIONS = {
  operario:    ['view_own_farm', 'register_water', 'register_feed', 'register_mortality'],
  coordinador: ['view_all_farms', 'register_water', 'register_feed', 'register_mortality', 'register_biometry', 'register_inputs', 'edit_inputs', 'view_reports'],
  gerente:     ['view_all_farms', 'manage_farms', 'manage_tanks', 'manage_cycles', 'harvest', 'view_reports', 'view_financials', 'manage_catalog'],
  asesor:      ['view_all_farms', 'view_reports', 'view_financials'],
  superadmin:  ['*'], // All permissions
};

export function can(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setSession(user, fincaId = null) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (fincaId) sessionStorage.setItem(FARM_KEY, fincaId);
}

export function getActiveFarm() {
  return sessionStorage.getItem(FARM_KEY) || null;
}

export function setActiveFarm(id) {
  sessionStorage.setItem(FARM_KEY, id);
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(FARM_KEY);
}

/**
 * Autenticar por email/rol — simula CU-AQUA-01
 * Retorna el usuario o lanza error
 */
export async function login(email, password) {
  const usuarios = await getAll('usuarios');
  const user = usuarios.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Credenciales incorrectas');
  return user;
}

/**
 * Hook de inicialización de página — redirige si no hay sesión
 * Devuelve { user, activeFarmId, role }
 */
export async function initAuth(allowedRoles = null) {
  const session = getSession();
  if (!session) { window.location.href = '/index.html'; return null; }

  if (allowedRoles && !allowedRoles.includes(session.rol)) {
    window.location.href = '/pages/dashboard.html';
    return null;
  }

  // Render sidebar user info if elements exist
  const elName   = document.getElementById('sidebarUserName');
  const elRole   = document.getElementById('sidebarUserRole');
  const elAvatar = document.getElementById('sidebarUserAvatar');
  if (elName)   elName.textContent   = session.nombre;
  if (elRole)   elRole.innerHTML     = `<span class="user-role-badge ${ROLES[session.rol]?.color}">${ROLES[session.rol]?.label || session.rol}</span>`;
  if (elAvatar) elAvatar.textContent = (session.nombre || 'U')[0].toUpperCase();

  // Mark active nav
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', path.includes(el.dataset.page));
  });

  // Hide items by role
  document.querySelectorAll('[data-requires-role]').forEach(el => {
    const required = el.dataset.requiresRole.split(',').map(r => r.trim());
    if (!required.includes(session.rol) && !required.includes('*')) el.style.display = 'none';
  });

  // Alert badge
  try {
    const badge = document.getElementById('navAlertBadge');
    if (badge) badge.style.display = 'none';
  } catch {}

  return { user: session, activeFarmId: getActiveFarm(), role: session.rol };
}

// ── Helpers UI ───────────────────────────────────────────────
export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const icons = { ok: '✅', warn: '⚠️', critical: '🚨', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

export function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export function formatNum(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return parseFloat(value).toFixed(decimals);
}

export function todayStr() { return new Date().toISOString().slice(0, 10); }

export function daysSince(dateStr) {
  if (!dateStr) return 0;
  const diff = new Date() - new Date(dateStr + 'T00:00:00');
  return Math.floor(diff / 86400000);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
