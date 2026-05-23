import {
  projectLote,
  calculateLMax,
  estimateHarvestDate,
  calculateCycleROI,
  type LoteState,
  type OperationalEvent,
  type SpeciesKey,
} from '@aquashell/shared';
import { createSupabaseServerClient, isSupabaseConfigured } from './supabase/server';

export interface LoteSnapshot {
  id: string;
  estanque: string;
  finca: string;
  state: LoteState;
  lmax: number;
  harvest: ReturnType<typeof estimateHarvestDate>;
  roi: ReturnType<typeof calculateCycleROI>;
  seedCostCop: number;
  pendingCount: number;
}

const SALE_PRICE_DEFAULT: Record<SpeciesKey, number> = {
  tilapia_nilotica: 8_000,
  cachama:          9_500,
  trucha:           15_000,
};

function buildSnapshot(
  id: string,
  estanque: string,
  finca: string,
  events: OperationalEvent[],
  pendingCount: number,
): LoteSnapshot | null {
  const state = projectLote(events);
  if (!state) return null;

  const lmax    = calculateLMax(state.biomasa_kg, 27, state.especie).lmax_kg;
  const harvest = estimateHarvestDate(
    state.peso_actual_g, state.dias_transcurridos, new Date(), state.especie
  );

  const initEvent = events.find(e => e.type === 'LOTE_INICIADO') as
    (OperationalEvent & { payload: { unidad_costo_cop: number } }) | undefined;
  const seedCostCop = initEvent?.payload.unidad_costo_cop ?? 350;

  const projectedBiomass = harvest.projected_weight_g
    ? (state.count_actual * harvest.projected_weight_g) / 1000
    : state.biomasa_kg;

  const roi = calculateCycleROI({
    seed_count:          state.count_inicial,
    seed_unit_cost_cop:  seedCostCop,
    total_feed_kg:       state.total_alimento_kg,
    feed_cost_per_kg_cop: 2_800,
    harvest_biomass_kg:  projectedBiomass,
    sale_price_cop_per_kg: SALE_PRICE_DEFAULT[state.especie],
  });

  return { id, estanque, finca, state, lmax, harvest, roi, seedCostCop, pendingCount };
}

export async function getAllSnapshots(): Promise<LoteSnapshot[]> {
  if (!isSupabaseConfigured()) return getDemoSnapshots();

  const supabase = createSupabaseServerClient();
  const { data: lotes } = await supabase
    .from('lotes')
    .select('id,estanques(nombre),fincas(nombre)')
    .eq('estado', 'activo');

  if (!lotes?.length) return [];

  const snapshots: LoteSnapshot[] = [];
  for (const l of lotes as unknown as Array<{ id: string; estanques: { nombre: string } | null; fincas: { nombre: string } | null }>) {
    const { data: eventos } = await supabase
      .from('evento_operativo')
      .select('*')
      .eq('id_lote', l.id)
      .order('ts', { ascending: true });

    const { count: pendingCount } = await supabase
      .from('evento_operativo')
      .select('id', { count: 'exact', head: true })
      .eq('id_lote', l.id)
      .eq('sync_status', 'pending');

    const snap = buildSnapshot(
      l.id,
      l.estanques?.nombre ?? l.id.slice(0, 8),
      l.fincas?.nombre ?? '—',
      (eventos ?? []) as OperationalEvent[],
      pendingCount ?? 0,
    );
    if (snap) snapshots.push(snap);
  }
  return snapshots;
}

// ── Demo data (no Supabase) ──────────────────────────────────────────────────

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

const DEMO_EVENTS_L1: OperationalEvent[] = [
  { id: 'g1', type: 'LOTE_INICIADO', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: daysAgo(68), sync_status: 'synced',
    payload: { especie: 'tilapia_nilotica', count_inicial: 1200, peso_inicial_g: 5,
               id_estanque: 'e1', id_finca: 'f1', unidad_costo_cop: 350 } as never },
  { id: 'g2', type: 'MUESTREO_BIOMETRICO', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: daysAgo(38), sync_status: 'synced',
    payload: { pesos_g: [], peso_promedio_g: 118.5, cv_pct: 9.2, valid: true, n: 20 } as never },
  { id: 'g3', type: 'MORTALIDAD_REGISTRADA', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: daysAgo(50), sync_status: 'synced',
    payload: { cantidad: 37, causa_presunta: 'hipoxia' } as never },
  { id: 'g4', type: 'ALIMENTO_SUMINISTRADO', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: daysAgo(0), sync_status: 'pending',
    payload: { kg_suministrado: 2.5, lmax_kg: 6.91, n_raciones: 2, temperatura_agua: 27 } as never },
];

const DEMO_EVENTS_L2: OperationalEvent[] = [
  { id: 'g5', type: 'LOTE_INICIADO', id_lote: 'demo-2', id_tenant: 't1', id_usuario: 'u2',
    ts: daysAgo(42), sync_status: 'synced',
    payload: { especie: 'tilapia_nilotica', count_inicial: 1000, peso_inicial_g: 8,
               id_estanque: 'e2', id_finca: 'f1', unidad_costo_cop: 350 } as never },
  { id: 'g6', type: 'MUESTREO_BIOMETRICO', id_lote: 'demo-2', id_tenant: 't1', id_usuario: 'u2',
    ts: daysAgo(12), sync_status: 'synced',
    payload: { pesos_g: [], peso_promedio_g: 69, cv_pct: 11.3, valid: true, n: 15 } as never },
];

function getDemoSnapshots(): LoteSnapshot[] {
  const s1 = buildSnapshot('demo-1', 'Estanque 1-A', 'La Esperanza', DEMO_EVENTS_L1, 4);
  const s2 = buildSnapshot('demo-2', 'Estanque 1-B', 'La Esperanza', DEMO_EVENTS_L2, 0);
  return [s1, s2].filter(Boolean) as LoteSnapshot[];
}
