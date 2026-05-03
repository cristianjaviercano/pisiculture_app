/**
 * AQUASHELL — waterQuality.js v3.0
 * Motor de validación CTQ (Critical-to-Quality) para 8 parámetros
 * Basado en TDD-006 y CU-AQUA-03
 */

export const CTQ_PARAMS = {
  temperatura: {
    key: 'temperatura', label: 'Temperatura', unit: '°C', icon: '🌡️',
    hard_min: 18,  warn_min: 22,  optimal_min: 25, optimal_max: 30, warn_max: 32, hard_max: 36,
    description: 'Rango óptimo para tilapia nilótica',
    tip_low: 'Temperatura baja reduce el metabolismo. Aumenta el período de ayuno.',
    tip_high: 'Temperatura alta aumenta el estrés. Reduce la alimentación al 50%.',
    blocking: false
  },
  oxigeno_disuelto: {
    key: 'oxigeno_disuelto', label: 'Oxígeno Disuelto', unit: 'mg/L', icon: '💧',
    hard_min: 4,   warn_min: 5,   optimal_min: 6,  optimal_max: 9,  warn_max: null, hard_max: null,
    description: 'OD crítico para supervivencia',
    tip_low: 'OD bajo: detén la alimentación y aumenta la aireación inmediatamente.',
    blocking: true,  // Bloquea alimentación si < hard_min
    hard_message: 'OD CRÍTICO — Detén toda alimentación. Activa aireación de emergencia.'
  },
  ph: {
    key: 'ph', label: 'pH', unit: 'pH', icon: '⚗️',
    hard_min: 5.5, warn_min: 6.0, optimal_min: 6.5, optimal_max: 8.5, warn_max: 9.0, hard_max: 9.5,
    description: 'pH del agua del estanque',
    tip_low: 'pH muy ácido — aplica cal según protocolo del Coordinador.',
    tip_high: 'pH muy alto — posible exceso de algas. Revisa con el Coordinador.',
    blocking: false
  },
  tan: {
    key: 'tan', label: 'TAN (Amoniaco Total)', unit: 'mg/L', icon: '🧪',
    hard_min: null, warn_min: null, optimal_min: null, optimal_max: 1.0, warn_max: 1.8, hard_max: 2.5,
    description: 'Nitrógeno amoniacal total — tóxico para branquias',
    tip_high: 'TAN elevado. Reduce la alimentación y aumenta recambio de agua.',
    blocking: true,
    hard_message: 'TAN CRÍTICO — Suspende alimentación. Notifica al Coordinador ahora.'
  },
  nitrito: {
    key: 'nitrito', label: 'Nitrito (NO₂⁻)', unit: 'mg/L', icon: '🔬',
    hard_min: null, warn_min: null, optimal_min: null, optimal_max: 0.1, warn_max: 0.5, hard_max: 1.0,
    description: 'Nitrito — indica nitrificación incompleta',
    tip_high: 'Nitrito alto — posible falla en el biofiltro. Notifica al Coordinador.',
    blocking: false
  },
  alcalinidad: {
    key: 'alcalinidad', label: 'Alcalinidad', unit: 'mg/L CaCO₃', icon: '🪨',
    hard_min: 40,  warn_min: 80,  optimal_min: 100, optimal_max: 300, warn_max: null, hard_max: null,
    description: 'Capacidad buffer del agua',
    tip_low: 'Alcalinidad baja — el pH puede fluctuar peligrosamente.',
    blocking: false
  },
  disco_secchi: {
    key: 'disco_secchi', label: 'Disco Secchi', unit: 'cm', icon: '👁️',
    hard_min: 20,  warn_min: 30,  optimal_min: 40, optimal_max: 80, warn_max: 90, hard_max: null,
    description: 'Visibilidad del agua (transparencia)',
    tip_low: 'Agua turbia — posible exceso de plancton o sólidos. Revisa filtros.',
    tip_high: 'Agua muy clara — puede indicar falta de plancton beneficioso.',
    blocking: false
  },
  salinidad: {
    key: 'salinidad', label: 'Salinidad', unit: 'ppt', icon: '🌊',
    hard_min: 0,   warn_min: null, optimal_min: 0,  optimal_max: 5,  warn_max: 8,  hard_max: 12,
    description: 'Salinidad del agua (para tilapia en agua salobre)',
    tip_high: 'Salinidad alta para tilapia. Verifica con el Asesor o Coordinador.',
    blocking: false
  }
};

/**
 * Evalúa el estado de un parámetro según los límites CTQ
 * @returns { status: 'ok'|'warn'|'critical', message, blocking }
 */
export function evaluateCTQ(key, value) {
  const p = CTQ_PARAMS[key];
  if (!p || value === null || value === undefined || isNaN(value)) {
    return { status: 'ok', message: '', blocking: false };
  }

  const v = parseFloat(value);

  // Check hard limits first (blocking)
  if (p.hard_min !== null && v < p.hard_min) {
    return { status: 'critical', message: p.hard_message || `${p.label} por debajo del límite crítico (${p.hard_min} ${p.unit})`, blocking: p.blocking || false };
  }
  if (p.hard_max !== null && v > p.hard_max) {
    return { status: 'critical', message: p.hard_message || `${p.label} por encima del límite crítico (${p.hard_max} ${p.unit})`, blocking: p.blocking || false };
  }

  // Check warn limits
  if (p.warn_min !== null && v < p.warn_min) {
    return { status: 'warn', message: p.tip_low || `${p.label} en zona de advertencia`, blocking: false };
  }
  if (p.warn_max !== null && v > p.warn_max) {
    return { status: 'warn', message: p.tip_high || `${p.label} en zona de advertencia`, blocking: false };
  }

  // Check optimal range
  if (p.optimal_min !== null && v < p.optimal_min) {
    return { status: 'warn', message: p.tip_low || `${p.label} levemente bajo`, blocking: false };
  }
  if (p.optimal_max !== null && v > p.optimal_max) {
    return { status: 'warn', message: p.tip_high || `${p.label} levemente alto`, blocking: false };
  }

  return { status: 'ok', message: `${p.label} dentro del rango óptimo`, blocking: false };
}

/**
 * Evalúa todos los parámetros de una lectura y retorna el resumen del sistema
 */
export function evaluateWaterReading(reading) {
  const results = {};
  let systemStatus = 'ok';
  let hasBlocking = false;
  const alerts = [];

  for (const key of Object.keys(CTQ_PARAMS)) {
    if (reading[key] !== undefined && reading[key] !== null) {
      const r = evaluateCTQ(key, reading[key]);
      results[key] = r;
      if (r.status === 'critical') { systemStatus = 'critical'; if (r.blocking) hasBlocking = true; }
      else if (r.status === 'warn' && systemStatus !== 'critical') systemStatus = 'warn';
      if (r.status !== 'ok') alerts.push({ key, ...r, label: CTQ_PARAMS[key].label, value: reading[key], unit: CTQ_PARAMS[key].unit });
    }
  }

  return { systemStatus, hasBlocking, results, alerts };
}

export const WATER_QUALITY_ICONS = { ok: '✅', warn: '⚠️', critical: '🚨' };
export const STATUS_COLORS = { ok: 'var(--color-ok)', warn: 'var(--color-warn)', critical: 'var(--color-critical)' };
