import Link from 'next/link';
import { createSupabaseServerClient, isSupabaseConfigured } from '../../../../../lib/supabase/server';
import type { OperationalEvent } from '@aquashell/shared';
import { CorrectionForm } from './CorrectionForm';
import { EventForm } from './EventForm';

export const dynamic = 'force-dynamic';

const TYPE_META: Record<string, { icon: string; label: string }> = {
  LOTE_INICIADO:          { icon: '🐣', label: 'Inicio de lote' },
  AGUA_REGISTRADA:        { icon: '💧', label: 'Calidad del agua' },
  ALIMENTO_SUMINISTRADO:  { icon: '🌾', label: 'Alimento suministrado' },
  MORTALIDAD_REGISTRADA:  { icon: '💀', label: 'Mortalidad' },
  MUESTREO_BIOMETRICO:    { icon: '📏', label: 'Muestreo biométrico' },
  INSUMO_APLICADO:        { icon: '💊', label: 'Insumo aplicado' },
  LOTE_COSECHADO:         { icon: '🎣', label: 'Cosecha' },
  CORRECCION_REGISTRADA:  { icon: '✏️', label: 'Corrección' },
};

function fmtDate(ts: string) {
  return new Date(ts).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Demo events for when Supabase is not configured
const DEMO_EVENTS: OperationalEvent[] = [
  { id: 'g1', type: 'LOTE_INICIADO', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: new Date(Date.now() - 68 * 86_400_000).toISOString(), sync_status: 'synced',
    payload: { especie: 'tilapia_nilotica', count_inicial: 1200, peso_inicial_g: 5,
               id_estanque: 'e1', id_finca: 'f1', unidad_costo_cop: 350 } as never },
  { id: 'g3', type: 'MORTALIDAD_REGISTRADA', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: new Date(Date.now() - 50 * 86_400_000).toISOString(), sync_status: 'synced',
    payload: { cantidad: 37, causa_presunta: 'hipoxia' } as never },
  { id: 'g2', type: 'MUESTREO_BIOMETRICO', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: new Date(Date.now() - 38 * 86_400_000).toISOString(), sync_status: 'synced',
    payload: { pesos_g: [], peso_promedio_g: 118.5, cv_pct: 9.2, valid: true, n: 20 } as never },
  { id: 'g4', type: 'ALIMENTO_SUMINISTRADO', id_lote: 'demo-1', id_tenant: 't1', id_usuario: 'u1',
    ts: new Date(Date.now() - 1 * 86_400_000).toISOString(), sync_status: 'pending',
    payload: { kg_suministrado: 2.5, lmax_kg: 6.91, n_raciones: 2, temperatura_agua: 27 } as never },
];

const SYNC_BADGE: Record<string, string> = {
  synced:   'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  conflict: 'bg-red-100 text-red-700',
};

async function getEvents(loteId: string): Promise<OperationalEvent[]> {
  if (!isSupabaseConfigured()) {
    return loteId.startsWith('demo') ? [...DEMO_EVENTS].reverse() : [];
  }
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('evento_operativo')
    .select('*')
    .eq('id_lote', loteId)
    .order('ts', { ascending: false });
  return (data ?? []) as OperationalEvent[];
}

export default async function LoteCorrectorPage({
  params,
}: {
  params: { id: string };
}) {
  const events = await getEvents(params.id);
  const corrections = new Set(
    events
      .filter(e => e.type === 'CORRECCION_REGISTRADA')
      .map(e => (e.payload as { evento_original_id: string }).evento_original_id)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/coordinador"
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            ← Coordinador
          </Link>
          <h1 className="text-xl font-bold text-slate-800">
            Eventos · {params.id.slice(0, 12)}…
          </h1>
        </div>
        <EventForm loteId={params.id} />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-2">📭</p>
          <p>Sin eventos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(ev => {
            const meta = TYPE_META[ev.type] ?? { icon: '●', label: ev.type };
            const hasCorrection = corrections.has(ev.id);
            const isCorrection = ev.type === 'CORRECCION_REGISTRADA';
            return (
              <div
                key={ev.id}
                className={`bg-white border rounded-xl p-4 ${hasCorrection ? 'border-amber-300' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="font-semibold text-slate-700 text-sm">{meta.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${SYNC_BADGE[ev.sync_status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {ev.sync_status}
                      </span>
                      {hasCorrection && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          ✏️ corregido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{fmtDate(ev.ts)} · {ev.id.slice(0, 8)}…</p>
                    <pre className="text-xs text-slate-600 bg-slate-50 rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  </div>
                  {!isCorrection && (
                    <div className="shrink-0">
                      <CorrectionForm
                        eventId={ev.id}
                        loteId={params.id}
                        eventType={ev.type}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
