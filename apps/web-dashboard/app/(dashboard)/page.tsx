import Link from 'next/link';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { projectLote, calculateLMax, type LoteState } from '@aquashell/shared';

interface LoteRow {
  id: string;
  especie: string;
  estado: string;
  fecha_inicio: string | null;
  count_actual: number;
  peso_actual_g: number;
  total_alimento_kg: number;
  estanques: { nombre: string } | null;
  fincas:    { nombre: string; municipio: string } | null;
}

interface EventRow {
  id: string;
  type: string;
  id_lote: string;
  id_tenant: string;
  id_usuario: string;
  ts: string;
  payload: Record<string, unknown>;
  sync_status: string;
}

interface LoteCard {
  row: LoteRow;
  state: LoteState | null;
  lmax: number;
  pendingCount: number;
}

function especieLabel(k: string) {
  return k === 'tilapia_nilotica' ? 'Tilapia Nilótica' : k === 'cachama' ? 'Cachama' : 'Trucha';
}

async function getLotes(): Promise<LoteCard[]> {
  if (!isSupabaseConfigured()) return getDemoData();

  const supabase = createSupabaseServerClient();
  const { data: lotes } = await supabase
    .from('lotes')
    .select('id,especie,estado,fecha_inicio,count_actual,peso_actual_g,total_alimento_kg,estanques(nombre),fincas(nombre,municipio)')
    .eq('estado', 'activo')
    .order('fecha_inicio', { ascending: false });

  if (!lotes?.length) return [];

  const cards: LoteCard[] = [];
  for (const row of lotes as LoteRow[]) {
    const { data: eventos } = await supabase
      .from('evento_operativo')
      .select('*')
      .eq('id_lote', row.id)
      .order('ts', { ascending: true });

    const { count: pendingCount } = await supabase
      .from('evento_operativo')
      .select('id', { count: 'exact', head: true })
      .eq('id_lote', row.id)
      .eq('sync_status', 'pending');

    const state = eventos?.length
      ? projectLote(eventos as EventRow[] as Parameters<typeof projectLote>[0])
      : null;

    const lmax = state ? calculateLMax(state.biomasa_kg, 27, state.especie).lmax_kg : 0;
    cards.push({ row, state, lmax, pendingCount: pendingCount ?? 0 });
  }
  return cards;
}

// Demo data shown when Supabase is not configured
function getDemoData(): LoteCard[] {
  return [
    {
      row: { id: 'demo-1', especie: 'tilapia_nilotica', estado: 'activo',
             fecha_inicio: new Date(Date.now() - 68*86400000).toISOString().slice(0,10),
             count_actual: 1163, peso_actual_g: 198, total_alimento_kg: 142,
             estanques: { nombre: 'Estanque 1-A' }, fincas: { nombre: 'La Esperanza', municipio: 'Espinal' } },
      state: null, lmax: 3.45, pendingCount: 4,
    },
    {
      row: { id: 'demo-2', especie: 'tilapia_nilotica', estado: 'activo',
             fecha_inicio: new Date(Date.now() - 42*86400000).toISOString().slice(0,10),
             count_actual: 978, peso_actual_g: 105, total_alimento_kg: 74,
             estanques: { nombre: 'Estanque 1-B' }, fincas: { nombre: 'La Esperanza', municipio: 'Espinal' } },
      state: null, lmax: 1.63, pendingCount: 0,
    },
  ];
}

export default async function DashboardPage() {
  const lotes = await getLotes();
  const demo  = !isSupabaseConfigured();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lotes Activos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vista del Coordinador</p>
        </div>
        {demo && (
          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
            MODO DEMO — sin Supabase
          </span>
        )}
      </div>

      {lotes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🐠</div>
          <p>No hay lotes activos en Supabase</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lotes.map(({ row, state, lmax, pendingCount }) => {
            const dias = row.fecha_inicio
              ? Math.floor((Date.now() - new Date(row.fecha_inicio).getTime()) / 86400000)
              : null;
            const biomasa = state?.biomasa_kg ?? ((row.count_actual * row.peso_actual_g) / 1000);

            return (
              <Link key={row.id} href={`/dashboard/lotes/${row.id}`} className="block group">
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-300 transition-all">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-bold text-gray-900">{row.estanques?.nombre ?? row.id.slice(0,8)}</p>
                      <p className="text-xs text-gray-500">{row.fincas?.nombre} · {row.fincas?.municipio}</p>
                    </div>
                    {pendingCount > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {pendingCount} ↑
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-primary-700 font-medium mb-3">{especieLabel(row.especie)}</p>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <Metric label="Días" value={dias != null ? `${dias} d` : '—'} />
                    <Metric label="Peces" value={row.count_actual.toLocaleString('es-CO')} />
                    <Metric label="Biomasa" value={`${biomasa.toFixed(1)} kg`} />
                    <Metric label="Peso" value={`${row.peso_actual_g} g`} />
                    <Metric label="LMax hoy" value={`${lmax} kg`} highlight />
                    <Metric label="Alimento" value={`${row.total_alimento_kg} kg`} />
                  </div>

                  {state?.retiro_activo && (
                    <div className="mt-3 bg-red-50 rounded-lg px-3 py-1.5 text-xs text-red-600 font-semibold">
                      ⛔ Período de retiro activo hasta {state.fecha_fin_retiro}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`font-bold ${highlight ? 'text-primary-700' : 'text-gray-800'}`}>{value}</p>
      <p className="text-gray-400 text-xs">{label}</p>
    </div>
  );
}
