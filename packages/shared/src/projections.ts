import { SPECIES_CONFIG, type SpeciesKey } from './species.js';
import type { OperationalEvent } from './events.js';

export interface GrowthPoint {
  day: number;
  abs_day: number;
  weight_g: number;
  daily_gain_g: number;
}

export interface HarvestEstimate {
  days_remaining: number | null;
  date: Date | null;
  target_weight_g: number;
  projected_weight_g?: number;
}

export interface LoteState {
  id_lote: string;
  especie: SpeciesKey;
  id_estanque: string;
  id_finca: string;
  fecha_inicio: string;
  count_inicial: number;
  count_actual: number;
  peso_actual_g: number;
  biomasa_kg: number;
  total_alimento_kg: number;
  fca_acumulado: number | null;
  retiro_activo: boolean;
  fecha_fin_retiro: string | null;
  ultimo_muestreo: {
    fecha: string;
    peso_promedio_g: number;
    cv_pct: number;
    valid: boolean;
  } | null;
  dias_transcurridos: number;
  cosechado: boolean;
  biomasa_cosechada_kg: number | null;
}

/**
 * Proyección Von Bertalanffy: W(t) = W∞ × (1 - e^(-k×t))³
 */
export function projectGrowth(
  initial_weight_g: number,
  days_elapsed: number,
  species: SpeciesKey = 'tilapia_nilotica',
): GrowthPoint[] {
  const { k_growth, Winf_g } = SPECIES_CONFIG[species];
  const points: GrowthPoint[] = [];

  for (let d = 0; d <= 180; d++) {
    const t = days_elapsed + d;
    const w = (age: number) => Winf_g * Math.pow(1 - Math.exp(-k_growth * age), 3);
    const weight_g = w(t);
    const daily_gain_g = d === 0 ? 0 : weight_g - w(t - 1);

    points.push({
      day: d,
      abs_day: t,
      weight_g: parseFloat(weight_g.toFixed(1)),
      daily_gain_g: parseFloat(daily_gain_g.toFixed(2)),
    });
  }

  // suppress unused param warning — initial_weight_g reserved for future Von Bert calibration
  void initial_weight_g;

  return points;
}

export function estimateHarvestDate(
  current_weight_g: number,
  days_elapsed: number,
  start_date: Date,
  species: SpeciesKey = 'tilapia_nilotica',
): HarvestEstimate {
  const cfg = SPECIES_CONFIG[species];
  const projection = projectGrowth(current_weight_g, days_elapsed, species);
  const harvestPoint = projection.find(p => p.weight_g >= cfg.target_weight_g);

  if (!harvestPoint) {
    return { days_remaining: null, date: null, target_weight_g: cfg.target_weight_g };
  }

  const harvestDate = new Date(start_date);
  harvestDate.setDate(harvestDate.getDate() + harvestPoint.abs_day);

  return {
    days_remaining: harvestPoint.day,
    date: harvestDate,
    target_weight_g: cfg.target_weight_g,
    projected_weight_g: harvestPoint.weight_g,
  };
}

/**
 * Deriva el estado actual de un lote a partir de su stream de eventos (event sourcing read model).
 * Los eventos son inmutables; esta función es la única forma de obtener estado derivado.
 */
export function projectLote(events: OperationalEvent[]): LoteState | null {
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts));

  let state: LoteState | null = null;

  for (const event of sorted) {
    switch (event.type) {
      case 'LOTE_INICIADO': {
        const p = event.payload;
        const count_actual = p.count_inicial;
        const biomasa_kg = parseFloat(((count_actual * p.peso_inicial_g) / 1000).toFixed(2));
        state = {
          id_lote: event.id_lote,
          especie: p.especie,
          id_estanque: p.id_estanque,
          id_finca: p.id_finca,
          fecha_inicio: event.ts.slice(0, 10),
          count_inicial: p.count_inicial,
          count_actual,
          peso_actual_g: p.peso_inicial_g,
          biomasa_kg,
          total_alimento_kg: 0,
          fca_acumulado: null,
          retiro_activo: false,
          fecha_fin_retiro: null,
          ultimo_muestreo: null,
          dias_transcurridos: 0,
          cosechado: false,
          biomasa_cosechada_kg: null,
        };
        break;
      }

      case 'ALIMENTO_SUMINISTRADO': {
        if (!state) break;
        state.total_alimento_kg = parseFloat(
          (state.total_alimento_kg + event.payload.kg_suministrado).toFixed(2),
        );
        const inicial_kg = (state.count_inicial * state.peso_actual_g) / 1000;
        const fca = state.total_alimento_kg > 0 && state.biomasa_kg > inicial_kg
          ? parseFloat((state.total_alimento_kg / (state.biomasa_kg - inicial_kg)).toFixed(2))
          : null;
        state.fca_acumulado = fca;
        break;
      }

      case 'MORTALIDAD_REGISTRADA': {
        if (!state) break;
        state.count_actual = Math.max(0, state.count_actual - event.payload.cantidad);
        state.biomasa_kg = parseFloat(((state.count_actual * state.peso_actual_g) / 1000).toFixed(2));
        break;
      }

      case 'MUESTREO_BIOMETRICO': {
        if (!state) break;
        const m = event.payload;
        if (m.valid) {
          state.peso_actual_g = m.peso_promedio_g;
          state.biomasa_kg = parseFloat(((state.count_actual * m.peso_promedio_g) / 1000).toFixed(2));
        }
        state.ultimo_muestreo = {
          fecha: event.ts.slice(0, 10),
          peso_promedio_g: m.peso_promedio_g,
          cv_pct: m.cv_pct,
          valid: m.valid,
        };
        break;
      }

      case 'INSUMO_APLICADO': {
        if (!state) break;
        const today = new Date().toISOString().slice(0, 10);
        state.retiro_activo = event.payload.fecha_fin_retiro >= today;
        state.fecha_fin_retiro = event.payload.fecha_fin_retiro;
        break;
      }

      case 'LOTE_COSECHADO': {
        if (!state) break;
        state.cosechado = true;
        state.biomasa_cosechada_kg = event.payload.biomasa_cosechada_kg;
        break;
      }

      case 'AGUA_REGISTRADA':
      case 'CORRECCION_REGISTRADA':
        break;
    }
  }

  if (state) {
    const fechaInicio = new Date(state.fecha_inicio);
    const hoy = new Date();
    state.dias_transcurridos = Math.floor(
      (hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return state;
}
