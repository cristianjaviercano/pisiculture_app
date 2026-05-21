import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateLMax, validateFeedAmount, calculateBiometrySample, calculateFCA, calculateCycleROI } from '../src/biomass.js';
import { evaluateCTQ, evaluateWaterReading } from '../src/waterQuality.js';
import { evaluateMortality } from '../src/mortality.js';
import { projectGrowth, estimateHarvestDate, projectLote } from '../src/projections.js';
import type { OperationalEvent } from '../src/events.js';

// ── Biomass / LMAx ──────────────────────────────────────────────────────────

describe('calculateLMax', () => {
  it('retorna LMAx correcto a temperatura óptima', () => {
    const result = calculateLMax(100, 27.5, 'tilapia_nilotica');
    assert.equal(result.lmax_kg, 3.0);
    assert.equal(result.adjusted, false);
  });

  it('reduce LMAx cuando la temperatura es alta (33°C)', () => {
    const optimal = calculateLMax(100, 27.5, 'tilapia_nilotica');
    const hot = calculateLMax(100, 33, 'tilapia_nilotica');
    assert.ok(hot.lmax_kg < optimal.lmax_kg, 'LMAx debe reducirse con temperatura alta');
    assert.equal(hot.adjusted, true);
  });

  it('reduce LMAx cuando la temperatura es baja (20°C)', () => {
    const optimal = calculateLMax(100, 27.5, 'tilapia_nilotica');
    const cold = calculateLMax(100, 20, 'tilapia_nilotica');
    assert.ok(cold.lmax_kg < optimal.lmax_kg, 'LMAx debe reducirse con temperatura baja');
    assert.equal(cold.adjusted, true);
  });

  it('usa especie cachama correctamente', () => {
    const result = calculateLMax(100, 27.5, 'cachama');
    assert.equal(result.lmax_kg, 2.5);
  });
});

describe('validateFeedAmount', () => {
  it('permite alimentación dentro del LMAx', () => {
    const r = validateFeedAmount(1.0, 3.0, 0);
    assert.equal(r.blocked, false);
    assert.equal(r.excess_kg, 0);
    assert.equal(r.remaining_kg, 3.0);
  });

  it('bloquea cuando se supera el LMAx', () => {
    const r = validateFeedAmount(2.0, 3.0, 2.5);
    assert.equal(r.blocked, true);
    assert.equal(r.excess_kg, 1.5);
  });

  it('calcula correctamente el pct_consumed', () => {
    const r = validateFeedAmount(0.5, 4.0, 2.0);
    assert.equal(r.pct_consumed, 50.0);
  });
});

// ── Biometría ──────────────────────────────────────────────────────────────

describe('calculateBiometrySample', () => {
  it('rechaza muestras con menos de 10 peces', () => {
    const r = calculateBiometrySample([100, 120, 110]);
    assert.equal(r.valid, false);
    assert.ok(r.reason?.includes('Mínimo 10 peces'));
  });

  it('valida una muestra con CV% <= 25%', () => {
    const uniform = Array.from({ length: 20 }, (_, i) => 200 + i * 2);
    const r = calculateBiometrySample(uniform);
    assert.equal(r.valid, true);
    assert.equal(r.reason, null);
    assert.ok(r.cv_pct <= 25);
  });

  it('invalida una muestra con CV% > 25%', () => {
    // Alta variabilidad: mezcla de alevines y peces grandes
    const mixed = [50, 55, 60, 300, 320, 310, 305, 315, 315, 318];
    const r = calculateBiometrySample(mixed);
    assert.equal(r.valid, false);
    assert.ok(r.cv_pct > 25);
  });

  it('calcula correctamente media y n', () => {
    const weights = Array.from({ length: 15 }, () => 200);
    const r = calculateBiometrySample(weights);
    assert.equal(r.n, 15);
    assert.equal(r.mean_g, 200.0);
    assert.equal(r.std_g, 0.0);
  });
});

// ── FCA ────────────────────────────────────────────────────────────────────

describe('calculateFCA', () => {
  it('calcula FCA correctamente', () => {
    const fca = calculateFCA(150, 50, 150);
    assert.equal(fca, 1.5);
  });

  it('retorna null cuando no hay ganancia de biomasa', () => {
    assert.equal(calculateFCA(100, 100, 100), null);
  });

  it('retorna null cuando no se suministró alimento', () => {
    assert.equal(calculateFCA(0, 50, 150), null);
  });
});

// ── Water Quality CTQ ──────────────────────────────────────────────────────

describe('evaluateCTQ', () => {
  it('OD óptimo devuelve ok', () => {
    const r = evaluateCTQ('oxigeno_disuelto', 7.0);
    assert.equal(r.status, 'ok');
    assert.equal(r.blocking, false);
  });

  it('OD < 4 devuelve crítico con bloqueo', () => {
    const r = evaluateCTQ('oxigeno_disuelto', 3.5);
    assert.equal(r.status, 'critical');
    assert.equal(r.blocking, true);
  });

  it('OD entre 4 y 5 devuelve warn', () => {
    const r = evaluateCTQ('oxigeno_disuelto', 4.5);
    assert.equal(r.status, 'warn');
  });

  it('TAN > 2.5 devuelve crítico con bloqueo', () => {
    const r = evaluateCTQ('tan', 3.0);
    assert.equal(r.status, 'critical');
    assert.equal(r.blocking, true);
  });

  it('pH en rango óptimo devuelve ok', () => {
    const r = evaluateCTQ('ph', 7.5);
    assert.equal(r.status, 'ok');
  });

  it('pH < 5.5 devuelve crítico', () => {
    const r = evaluateCTQ('ph', 5.0);
    assert.equal(r.status, 'critical');
  });
});

describe('evaluateWaterReading', () => {
  it('lectura limpia devuelve systemStatus ok', () => {
    const r = evaluateWaterReading({
      temperatura: 27,
      oxigeno_disuelto: 7.0,
      ph: 7.2,
      tan: 0.5,
    });
    assert.equal(r.systemStatus, 'ok');
    assert.equal(r.hasBlocking, false);
    assert.equal(r.alerts.length, 0);
  });

  it('detecta bloqueo cuando OD es crítico', () => {
    const r = evaluateWaterReading({ oxigeno_disuelto: 3.0 });
    assert.equal(r.systemStatus, 'critical');
    assert.equal(r.hasBlocking, true);
  });

  it('agrega múltiples alertas', () => {
    const r = evaluateWaterReading({
      oxigeno_disuelto: 4.5,
      ph: 5.8,
      tan: 1.5,
    });
    assert.ok(r.alerts.length >= 2);
  });
});

// ── Mortalidad ─────────────────────────────────────────────────────────────

describe('evaluateMortality', () => {
  it('mortalidad >= 1% es crítica', () => {
    const r = evaluateMortality(15, 1000);
    assert.equal(r.status, 'critical');
  });

  it('mortalidad >= 0.5% es warn', () => {
    const r = evaluateMortality(6, 1000);
    assert.equal(r.status, 'warn');
  });

  it('mortalidad < 0.1% es ok', () => {
    const r = evaluateMortality(0, 1000);
    assert.equal(r.status, 'ok');
  });

  it('maneja current_count = 0 sin división por cero', () => {
    const r = evaluateMortality(5, 0);
    assert.equal(r.status, 'ok');
    assert.equal(r.rate_pct, 0);
  });
});

// ── Proyecciones Von Bertalanffy ───────────────────────────────────────────

describe('projectGrowth', () => {
  it('retorna 181 puntos (días 0..180)', () => {
    const points = projectGrowth(50, 30, 'tilapia_nilotica');
    assert.equal(points.length, 181);
  });

  it('el peso del día 0 corresponde al día abs_day=days_elapsed', () => {
    const points = projectGrowth(50, 30, 'tilapia_nilotica');
    assert.equal(points[0]?.abs_day, 30);
  });

  it('proyecta que tilapia alcanza 350g antes del día 180', () => {
    const points = projectGrowth(5, 1, 'tilapia_nilotica');
    const reachTarget = points.some(p => p.weight_g >= 350);
    assert.ok(reachTarget, 'La tilapia debe alcanzar 350g');
  });
});

describe('estimateHarvestDate', () => {
  it('estima fecha de cosecha para tilapia desde peso 100g', () => {
    const start = new Date('2025-01-01');
    const result = estimateHarvestDate(100, 60, start, 'tilapia_nilotica');
    assert.ok(result.days_remaining !== null, 'Debe haber fecha estimada');
    assert.ok((result.days_remaining ?? 0) > 0, 'Deben quedar días de cultivo');
    assert.ok(result.date instanceof Date);
  });
});

// ── projectLote (event sourcing) ───────────────────────────────────────────

describe('projectLote', () => {
  const baseTs = '2025-01-01T08:00:00.000Z';

  const eventos: OperationalEvent[] = [
    {
      id: 'ev-1', type: 'LOTE_INICIADO', id_lote: 'lote-test',
      id_tenant: 'tenant-1', id_usuario: 'u-1', ts: baseTs, sync_status: 'synced',
      payload: {
        especie: 'tilapia_nilotica', count_inicial: 1000, peso_inicial_g: 5,
        id_estanque: 'est-1', id_finca: 'finca-1', unidad_costo_cop: 350,
      },
    },
    {
      id: 'ev-2', type: 'ALIMENTO_SUMINISTRADO', id_lote: 'lote-test',
      id_tenant: 'tenant-1', id_usuario: 'u-1', ts: '2025-01-02T08:00:00.000Z',
      sync_status: 'synced',
      payload: { kg_suministrado: 2.5, lmax_kg: 3.0, n_raciones: 3 },
    },
    {
      id: 'ev-3', type: 'MORTALIDAD_REGISTRADA', id_lote: 'lote-test',
      id_tenant: 'tenant-1', id_usuario: 'u-1', ts: '2025-01-03T08:00:00.000Z',
      sync_status: 'pending',
      payload: { cantidad: 5, causa_presunta: 'hipoxia' },
    },
    {
      id: 'ev-4', type: 'MUESTREO_BIOMETRICO', id_lote: 'lote-test',
      id_tenant: 'tenant-1', id_usuario: 'u-1', ts: '2025-01-15T08:00:00.000Z',
      sync_status: 'pending',
      payload: {
        pesos_g: Array.from({ length: 20 }, (_, i) => 48 + i),
        peso_promedio_g: 57.5,
        cv_pct: 12.5,
        valid: true,
        n: 20,
      },
    },
  ];

  it('deriva estado inicial desde LOTE_INICIADO', () => {
    const state = projectLote([eventos[0]!]);
    assert.ok(state !== null);
    assert.equal(state.count_actual, 1000);
    assert.equal(state.peso_actual_g, 5);
    assert.equal(state.total_alimento_kg, 0);
  });

  it('acumula alimento correctamente', () => {
    const state = projectLote([eventos[0]!, eventos[1]!]);
    assert.equal(state?.total_alimento_kg, 2.5);
  });

  it('descuenta mortalidades del count_actual', () => {
    const state = projectLote([eventos[0]!, eventos[2]!]);
    assert.equal(state?.count_actual, 995);
  });

  it('actualiza peso_actual_g con muestreo válido', () => {
    const state = projectLote(eventos);
    assert.equal(state?.peso_actual_g, 57.5);
    assert.equal(state?.ultimo_muestreo?.valid, true);
  });

  it('retorna null si no hay evento LOTE_INICIADO', () => {
    const state = projectLote([eventos[1]!]);
    assert.equal(state, null);
  });
});

// ── ROI ────────────────────────────────────────────────────────────────────

describe('calculateCycleROI', () => {
  it('calcula ROI positivo correctamente', () => {
    const r = calculateCycleROI({
      seed_count: 1000,
      seed_unit_cost_cop: 350,
      total_feed_kg: 400,
      feed_cost_per_kg_cop: 2800,
      harvest_biomass_kg: 350,
      sale_price_cop_per_kg: 8000,
    });
    assert.equal(r.profitable, true);
    assert.ok(r.roi_pct !== null && r.roi_pct > 0);
  });

  it('detecta operación no rentable', () => {
    const r = calculateCycleROI({
      seed_count: 1000,
      seed_unit_cost_cop: 350,
      total_feed_kg: 2000,
      feed_cost_per_kg_cop: 2800,
      harvest_biomass_kg: 100,
      sale_price_cop_per_kg: 3000,
    });
    assert.equal(r.profitable, false);
  });
});
