import { SPECIES_CONFIG, type SpeciesKey } from './species.js';

export interface LMaxResult {
  lmax_kg: number;
  feeding_rate_pct: string;
  adjusted: boolean;
}

export interface FeedValidationResult {
  blocked: boolean;
  remaining_kg: number;
  already_fed_kg: number;
  lmax_kg: number;
  excess_kg: number;
  pct_consumed: number;
}

export interface BiometrySampleResult {
  valid: boolean;
  n: number;
  mean_g: number;
  std_g: number;
  cv_pct: number;
  min_g: number;
  max_g: number;
  reason: string | null;
}

export interface CycleROIInput {
  seed_count: number;
  seed_unit_cost_cop: number;
  total_feed_kg: number;
  feed_cost_per_kg_cop?: number;
  harvest_biomass_kg: number;
  sale_price_cop_per_kg: number;
}

export interface CycleROIResult {
  seed_cost: number;
  feed_cost: number;
  total_cost: number;
  gross_income: number;
  gross_margin: number;
  roi_pct: number | null;
  profitable: boolean;
}

/**
 * Calcula el LMAx (Límite Máximo de Alimentación del día).
 * Ajusta por temperatura usando modelo biológico Q10=2.
 */
export function calculateLMax(
  biomass_kg: number,
  temp = 27,
  species: SpeciesKey = 'tilapia_nilotica',
): LMaxResult {
  const cfg = SPECIES_CONFIG[species];
  const optimal_temp = 27.5;
  const temp_factor = Math.max(0.3, Math.min(1.0, 1 - Math.abs(temp - optimal_temp) * 0.04));
  const rate = (cfg.feeding_rate_pct / 100) * temp_factor;
  const lmax_kg = parseFloat((biomass_kg * rate).toFixed(2));

  return {
    lmax_kg,
    feeding_rate_pct: (rate * 100).toFixed(2),
    adjusted: temp_factor < 0.95,
  };
}

export function validateFeedAmount(
  kg_to_feed: number,
  lmax_kg: number,
  already_fed_today_kg = 0,
): FeedValidationResult {
  const remaining = Math.max(0, lmax_kg - already_fed_today_kg);
  const blocked = already_fed_today_kg + kg_to_feed > lmax_kg;

  return {
    blocked,
    remaining_kg: parseFloat(remaining.toFixed(2)),
    already_fed_kg: parseFloat(already_fed_today_kg.toFixed(2)),
    lmax_kg: parseFloat(lmax_kg.toFixed(2)),
    excess_kg: blocked
      ? parseFloat((already_fed_today_kg + kg_to_feed - lmax_kg).toFixed(2))
      : 0,
    pct_consumed: parseFloat(((already_fed_today_kg / lmax_kg) * 100).toFixed(1)),
  };
}

/**
 * Valida un muestreo biométrico.
 * CV% > 25% invalida la actualización automática del LMAx.
 */
export function calculateBiometrySample(weights: number[]): BiometrySampleResult {
  if (weights.length < 10) {
    return {
      valid: false,
      n: weights.length,
      mean_g: 0,
      std_g: 0,
      cv_pct: 0,
      min_g: 0,
      max_g: 0,
      reason: 'Mínimo 10 peces requeridos para el muestreo',
    };
  }

  const n = weights.length;
  const mean = weights.reduce((a, b) => a + b, 0) / n;
  const variance = weights.reduce((s, w) => s + Math.pow(w - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  const cv_pct = (std / mean) * 100;
  const valid = cv_pct <= 25;

  return {
    valid,
    n,
    mean_g: parseFloat(mean.toFixed(1)),
    std_g: parseFloat(std.toFixed(1)),
    cv_pct: parseFloat(cv_pct.toFixed(1)),
    min_g: Math.min(...weights),
    max_g: Math.max(...weights),
    reason: valid
      ? null
      : `CV% = ${cv_pct.toFixed(1)}% supera el umbral del 25%. El muestreo tiene alta variabilidad. Se guarda con flag pero NO actualiza el LMAx automáticamente.`,
  };
}

/**
 * FCA = Alimento total consumido / Ganancia de biomasa.
 * Retorna null si no hay ganancia positiva.
 */
export function calculateFCA(
  total_feed_kg: number,
  initial_biomass_kg: number,
  current_biomass_kg: number,
): number | null {
  const gain = current_biomass_kg - initial_biomass_kg;
  if (gain <= 0 || total_feed_kg <= 0) return null;
  return parseFloat((total_feed_kg / gain).toFixed(2));
}

export function calculateCycleROI(input: CycleROIInput): CycleROIResult {
  const feed_cost_per_kg = input.feed_cost_per_kg_cop ?? 2800;
  const seed_cost = input.seed_count * input.seed_unit_cost_cop;
  const feed_cost = input.total_feed_kg * feed_cost_per_kg;
  const total_cost = seed_cost + feed_cost;
  const gross_income = input.harvest_biomass_kg * input.sale_price_cop_per_kg;
  const gross_margin = gross_income - total_cost;
  const roi_pct = total_cost > 0 ? parseFloat(((gross_margin / total_cost) * 100).toFixed(1)) : null;

  return {
    seed_cost,
    feed_cost,
    total_cost,
    gross_income,
    gross_margin,
    roi_pct,
    profitable: roi_pct !== null && roi_pct > 0,
  };
}
