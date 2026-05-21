import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { projectLote, calculateLMax, estimateHarvestDate, type OperationalEvent } from '@aquashell/shared';

const EVENT_LABELS: Record<string, string> = {
  LOTE_INICIADO:          '🐣 Lote iniciado',
  AGUA_REGISTRADA:        '💧 Agua registrada',
  ALIMENTO_SUMINISTRADO:  '🌾 Alimento suministrado',
  MORTALIDAD_REGISTRADA:  '💀 Mortalidad',
  MUESTREO_BIOMETRICO:    '📏 Biometría',
  INSUMO_APLICADO:        '💊 Insumo aplicado',
  LOTE_COSECHADO:         '🎣 Cosechado',
  CORRECCION_REGISTRADA:  '✏️ Corrección',
};

async function getData(id: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseServerClient();
  const [{ data: lote }, { data: eventos }] = await Promise.all([
    supabase.from('lotes').select('nombre,estanques(nombre),fincas(nombre)').eq('id', id).single(),
    supabase.from('evento_operativo').select('*').eq('id_lote', id).order('ts', { ascending: true }),
  ]);

  if (!eventos?.length) return null;
  return {
    eventos: eventos as OperationalEvent[],
    nombre:  (lote as { nombre?: string } | null)?.nombre ?? id.slice(0, 8),
    estanque: (lote as { estanques?: { nombre: string } | null } | null)?.estanques?.nombre,
    finca:    (lote as { fincas?: { nombre: string } | null } | null)?.fincas?.nombre,
  };
}

export default async function LoteDetailPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  const eventos = data?.eventos ?? null;

  if (!isSupabaseConfigured()) {
    return (
      <div className="text-center py-20">
        <p className="text-amber-600 font-semibold">
          ⚙️ Conecta Supabase para ver el detalle del lote en tiempo real.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-primary-700 underline text-sm">
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  if (!eventos) return notFound();

  const state = projectLote(eventos);
  if (!state) return notFound();

  const lmax = calculateLMax(state.biomasa_kg, 27, state.especie);
  const harvest = estimateHarvestDate(state.peso_actual_g, state.dias_transcurridos, new Date(), state.especie);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Lotes</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{data?.nombre ?? params.id.slice(0, 8)}</h1>
        {data?.estanque && <span className="text-sm text-gray-400">{data.estanque}{data.finca ? ` · ${data.finca}` : ''}</span>}
        {state.cosechado && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">COSECHADO</span>
        )}
        {state.retiro_activo && (
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
            ⛔ RETIRO hasta {state.fecha_fin_retiro}
          </span>
        )}
      </div>

      {/* Estado del ciclo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">Estado del Ciclo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Días en ciclo" value={`${state.dias_transcurridos} d`} />
          <Stat label="Peces actuales" value={state.count_actual.toLocaleString('es-CO')} />
          <Stat label="Biomasa" value={`${state.biomasa_kg.toFixed(1)} kg`} />
          <Stat label="Peso promedio" value={`${state.peso_actual_g} g`} />
          <Stat label="LMax hoy" value={`${lmax.lmax_kg} kg`} highlight />
          <Stat label="FCA acumulado" value={state.fca_acumulado?.toFixed(2) ?? '—'} />
          <Stat label="Cosecha estimada"
            value={harvest.days_remaining != null ? `~${harvest.days_remaining} d (${harvest.projected_weight_g?.toFixed(0)} g)` : 'N/D'} />
          <Stat label="Alimento total" value={`${state.total_alimento_kg.toFixed(1)} kg`} />
        </div>
      </div>

      {/* Último muestreo */}
      {state.ultimo_muestreo && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Último Muestreo Biométrico</h2>
          <div className="flex gap-6 text-sm">
            <span className="text-gray-600">📅 {state.ultimo_muestreo.fecha}</span>
            <span className="font-semibold">{state.ultimo_muestreo.peso_promedio_g} g promedio</span>
            <span className={state.ultimo_muestreo.cv_pct > 25 ? 'text-red-600 font-bold' : 'text-gray-600'}>
              CV {state.ultimo_muestreo.cv_pct}%
            </span>
            <span className={state.ultimo_muestreo.valid ? 'text-green-600' : 'text-amber-600'}>
              {state.ultimo_muestreo.valid ? '✅ Válido' : '⚠️ Alta variabilidad'}
            </span>
          </div>
        </div>
      )}

      {/* Stream de eventos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
          Stream de Eventos ({eventos.length})
        </h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {[...eventos].reverse().map(ev => (
            <div key={ev.id} className="flex gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
              <div className="w-32 text-gray-400 shrink-0 text-xs pt-0.5">
                {new Date(ev.ts).toLocaleDateString('es-CO')}
                <br />
                {new Date(ev.ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{EVENT_LABELS[ev.type] ?? ev.type}</p>
                <p className="text-gray-500 text-xs font-mono mt-0.5">
                  {JSON.stringify(ev.payload).slice(0, 120)}…
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full h-fit ${
                ev.sync_status === 'synced' ? 'bg-green-100 text-green-700' :
                ev.sync_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {ev.sync_status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-lg font-bold ${highlight ? 'text-primary-700' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
