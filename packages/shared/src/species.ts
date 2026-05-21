export type SpeciesKey = 'tilapia_nilotica' | 'cachama' | 'trucha';

export interface SpeciesConfig {
  name: string;
  latin: string;
  target_weight_g: number;
  fcr_optimal: number;
  fcr_max_acceptable: number;
  feeding_rate_pct: number;
  mortality_threshold_daily_pct: number;
  k_growth: number;
  Winf_g: number;
  min_harvest_weight_g: number;
  max_density_kg_m3: number;
}

export const SPECIES_CONFIG: Record<SpeciesKey, SpeciesConfig> = {
  tilapia_nilotica: {
    name: 'Tilapia Nilótica',
    latin: 'Oreochromis niloticus',
    target_weight_g: 350,
    fcr_optimal: 1.5,
    fcr_max_acceptable: 2.2,
    feeding_rate_pct: 3.0,
    mortality_threshold_daily_pct: 0.1,
    k_growth: 0.008,
    Winf_g: 800,
    min_harvest_weight_g: 280,
    max_density_kg_m3: 60,
  },
  cachama: {
    name: 'Cachama Blanca',
    latin: 'Piaractus brachypomus',
    target_weight_g: 600,
    fcr_optimal: 1.8,
    fcr_max_acceptable: 2.5,
    feeding_rate_pct: 2.5,
    mortality_threshold_daily_pct: 0.08,
    k_growth: 0.006,
    Winf_g: 1200,
    min_harvest_weight_g: 400,
    max_density_kg_m3: 40,
  },
  trucha: {
    name: 'Trucha Arcoíris',
    latin: 'Oncorhynchus mykiss',
    target_weight_g: 250,
    fcr_optimal: 1.2,
    fcr_max_acceptable: 1.8,
    feeding_rate_pct: 1.8,
    mortality_threshold_daily_pct: 0.05,
    k_growth: 0.012,
    Winf_g: 500,
    min_harvest_weight_g: 200,
    max_density_kg_m3: 80,
  },
};

export function getSpecies(key: SpeciesKey): SpeciesConfig {
  return SPECIES_CONFIG[key];
}
