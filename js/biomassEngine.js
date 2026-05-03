/**
 * AQUASHELL — biomassEngine.js v3.0
 * Motor local de biomasa, LMAx y crecimiento
 * Basado en TDD-004 y CU-AQUA-04, CU-AQUA-07
 */

export const SPECIES_CONFIG = {
  tilapia_nilotica: {
    name: 'Tilapia Nilótica', latin: 'Oreochromis niloticus',
    target_weight_g: 350, fcr_optimal: 1.5, fcr_max_acceptable: 2.2,
    feeding_rate_pct: 3.0, // % de biomasa/día a temperatura óptima
    mortality_threshold_daily_pct: 0.1, // 0.1%/día = alerta
    k_growth: 0.008, Winf_g: 800, // Von Bertalanffy params
    min_harvest_weight_g: 280, max_density_kg_m3: 60
  },
  cachama: {
    name: 'Cachama Blanca', latin: 'Piaractus brachypomus',
    target_weight_g: 600, fcr_optimal: 1.8, fcr_max_acceptable: 2.5,
    feeding_rate_pct: 2.5, mortality_threshold_daily_pct: 0.08,
    k_growth: 0.006, Winf_g: 1200, min_harvest_weight_g: 400, max_density_kg_m3: 40
  },
  trucha: {
    name: 'Trucha Arcoíris', latin: 'Oncorhynchus mykiss',
    target_weight_g: 250, fcr_optimal: 1.2, fcr_max_acceptable: 1.8,
    feeding_rate_pct: 1.8, mortality_threshold_daily_pct: 0.05,
    k_growth: 0.012, Winf_g: 500, min_harvest_weight_g: 200, max_density_kg_m3: 80
  }
};

/**
 * Calcula la Tasa de Alimentación Diaria Máxima (LMAx)
 * Hard Limit según CU-AQUA-04
 * @param {number} biomass_kg - Biomasa actual en kg
 * @param {number} temp - Temperatura del agua en °C
 * @param {string} species - Clave de especie
 * @returns {{ lmax_kg: number, feeding_rate_pct: number, adjusted: boolean }}
 */
export function calculateLMax(biomass_kg, temp = 27, species = 'tilapia_nilotica') {
  const cfg = SPECIES_CONFIG[species] || SPECIES_CONFIG.tilapia_nilotica;
  let rate = cfg.feeding_rate_pct / 100;

  // Ajuste por temperatura (modelo biológico simplificado Q10=2)
  const optimal_temp = 27.5;
  const temp_factor = Math.max(0.3, Math.min(1.0, 1 - Math.abs(temp - optimal_temp) * 0.04));
  rate *= temp_factor;

  const lmax_kg = parseFloat((biomass_kg * rate).toFixed(2));
  return { lmax_kg, feeding_rate_pct: (rate * 100).toFixed(2), adjusted: temp_factor < 0.95 };
}

/**
 * Valida una cantidad de alimento contra el LMAx del día
 * Implementa el Hard Limit de CU-AQUA-04
 */
export function validateFeedAmount(kg_to_feed, lmax_kg, already_fed_today_kg = 0) {
  const remaining = Math.max(0, lmax_kg - already_fed_today_kg);
  const blocked = (already_fed_today_kg + kg_to_feed) > lmax_kg;

  return {
    blocked,
    remaining_kg: parseFloat(remaining.toFixed(2)),
    already_fed_kg: parseFloat(already_fed_today_kg.toFixed(2)),
    lmax_kg: parseFloat(lmax_kg.toFixed(2)),
    excess_kg: blocked ? parseFloat((already_fed_today_kg + kg_to_feed - lmax_kg).toFixed(2)) : 0,
    pct_consumed: parseFloat(((already_fed_today_kg / lmax_kg) * 100).toFixed(1))
  };
}

/**
 * Proyección Von Bertalanffy para N días desde peso inicial
 * W(t) = W∞ × (1 - e^(-k×t))^3
 */
export function projectGrowth(initial_weight_g, days_elapsed, species = 'tilapia_nilotica') {
  const cfg = SPECIES_CONFIG[species] || SPECIES_CONFIG.tilapia_nilotica;
  const { k_growth, Winf_g } = cfg;

  const projection = [];
  for (let d = 0; d <= 180; d++) {
    const t = days_elapsed + d;
    const weight = Winf_g * Math.pow(1 - Math.exp(-k_growth * t), 3);
    const daily_gain = d === 0 ? 0 :
      Winf_g * Math.pow(1 - Math.exp(-k_growth * t), 3) -
      Winf_g * Math.pow(1 - Math.exp(-k_growth * (t - 1)), 3);
    projection.push({
      day: d,
      abs_day: t,
      weight_g: parseFloat(weight.toFixed(1)),
      daily_gain_g: parseFloat(daily_gain.toFixed(2))
    });
  }
  return projection;
}

/**
 * Estima la fecha y días restantes hasta peso objetivo de cosecha
 */
export function estimateHarvestDate(current_weight_g, days_elapsed, start_date, species = 'tilapia_nilotica') {
  const cfg = SPECIES_CONFIG[species] || SPECIES_CONFIG.tilapia_nilotica;
  const projection = projectGrowth(current_weight_g, days_elapsed, species);
  const harvestPoint = projection.find(p => p.weight_g >= cfg.target_weight_g);

  if (!harvestPoint) return { days_remaining: null, date: null, target_weight_g: cfg.target_weight_g };

  const harvestDate = new Date(start_date);
  harvestDate.setDate(harvestDate.getDate() + harvestPoint.abs_day);

  return {
    days_remaining: harvestPoint.day,
    date: harvestDate,
    target_weight_g: cfg.target_weight_g,
    projected_weight_g: harvestPoint.weight_g
  };
}

/**
 * Calcula FCA (Factor de Conversión Alimenticia) acumulado
 * FCA = Alimento total consumido / Ganancia de biomasa
 */
export function calculateFCA(total_feed_kg, initial_biomass_kg, current_biomass_kg) {
  const gain = current_biomass_kg - initial_biomass_kg;
  if (gain <= 0 || total_feed_kg <= 0) return null;
  return parseFloat((total_feed_kg / gain).toFixed(2));
}

/**
 * Calcula el CV% de un muestreo biométrico
 * Si CV% > 25% → muestreo rechazado (no actualiza LMAx automáticamente)
 */
export function calculateBiometrySample(weights_array) {
  if (!weights_array || weights_array.length < 10) {
    return { valid: false, reason: 'Mínimo 10 peces requeridos para el muestreo' };
  }

  const n = weights_array.length;
  const mean = weights_array.reduce((a, b) => a + b, 0) / n;
  const variance = weights_array.reduce((s, w) => s + Math.pow(w - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  const cv_pct = (std / mean) * 100;

  const valid = cv_pct <= 25;

  return {
    valid,
    n,
    mean_g: parseFloat(mean.toFixed(1)),
    std_g: parseFloat(std.toFixed(1)),
    cv_pct: parseFloat(cv_pct.toFixed(1)),
    min_g: Math.min(...weights_array),
    max_g: Math.max(...weights_array),
    reason: valid ? null : `CV% = ${cv_pct.toFixed(1)}% supera el umbral del 25%. El muestreo tiene alta variabilidad. Se guarda con flag pero NO actualiza el LMAx automáticamente.`
  };
}

/**
 * Evalúa la mortalidad diaria y genera severidad
 */
export function evaluateMortality(deaths_today, current_count) {
  if (!current_count || current_count <= 0) return { status: 'ok', rate_pct: 0, message: '' };
  const rate_pct = (deaths_today / current_count) * 100;

  if (rate_pct >= 1.0) return { status: 'critical', rate_pct: parseFloat(rate_pct.toFixed(3)), message: `Mortalidad CRÍTICA: ${rate_pct.toFixed(2)}%/día. Notifica al Coordinador INMEDIATAMENTE.` };
  if (rate_pct >= 0.5) return { status: 'warn', rate_pct: parseFloat(rate_pct.toFixed(3)), message: `Mortalidad elevada: ${rate_pct.toFixed(2)}%/día. Revisa la calidad del agua.` };
  if (rate_pct >= 0.1) return { status: 'warn', rate_pct: parseFloat(rate_pct.toFixed(3)), message: `Mortalidad en zona de alerta: ${rate_pct.toFixed(2)}%/día.` };
  return { status: 'ok', rate_pct: parseFloat(rate_pct.toFixed(3)), message: `Mortalidad normal: ${rate_pct.toFixed(2)}%/día.` };
}

/**
 * Calcula ROI del ciclo
 */
export function calculateCycleROI({ seed_count, seed_unit_cost_cop, total_feed_kg, feed_cost_per_kg_cop = 2800, harvest_biomass_kg, sale_price_cop_per_kg }) {
  const seed_cost = seed_count * seed_unit_cost_cop;
  const feed_cost = total_feed_kg * feed_cost_per_kg_cop;
  const total_cost = seed_cost + feed_cost;
  const gross_income = harvest_biomass_kg * sale_price_cop_per_kg;
  const gross_margin = gross_income - total_cost;
  const roi_pct = total_cost > 0 ? (gross_margin / total_cost) * 100 : null;

  return {
    seed_cost, feed_cost, total_cost, gross_income, gross_margin,
    roi_pct: roi_pct !== null ? parseFloat(roi_pct.toFixed(1)) : null,
    profitable: roi_pct !== null && roi_pct > 0
  };
}
