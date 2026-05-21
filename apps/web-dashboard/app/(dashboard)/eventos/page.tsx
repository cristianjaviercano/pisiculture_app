import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

const EVENT_ICONS: Record<string, string> = {
  LOTE_INICIADO:         '🐣',
  AGUA_REGISTRADA:       '💧',
  ALIMENTO_SUMINISTRADO: '🌾',
  MORTALIDAD_REGISTRADA: '💀',
  MUESTREO_BIOMETRICO:   '📏',
  INSUMO_APLICADO:       '💊',
  LOTE_COSECHADO:        '🎣',
  CORRECCION_REGISTRADA: '✏️',
};

interface EventRow {
  id: string;
  type: string;
  id_lote: string;
  id_usuario: string;
  ts: string;
  payload: Record<string, unknown>;
  sync_status: string;
}

async function getRecentEvents(): Promise<EventRow[]> {
  if (!isSupabaseConfigured()) return DEMO_EVENTS;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('evento_operativo')
    .select('id,type,id_lote,id_usuario,ts,payload,sync_status')
    .order('ts', { ascending: false })
    .limit(100);
  return (data as EventRow[]) ?? [];
}

export default async function EventosPage() {
  const eventos = await getRecentEvents();
  const demo = !isSupabaseConfigured();

  const pending = eventos.filter(e => e.sync_status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stream de Eventos</h1>
          <p className="text-gray-500 text-sm">Últimos 100 eventos operativos</p>
        </div>
        <div className="flex gap-3 items-center">
          {pending > 0 && (
            <span className="bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-1 rounded-full">
              {pending} pendiente{pending > 1 ? 's' : ''} de sync
            </span>
          )}
          {demo && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              MODO DEMO
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha / Hora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lote</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payload</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {eventos.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                    {new Date(ev.ts).toLocaleDateString('es-CO')}
                    {' '}
                    {new Date(ev.ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                    {EVENT_ICONS[ev.type] ?? '●'} {ev.type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {ev.id_lote.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-xs truncate">
                    {JSON.stringify(ev.payload).slice(0, 80)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      ev.sync_status === 'synced'  ? 'bg-green-100 text-green-700' :
                      ev.sync_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                     'bg-red-100 text-red-700'
                    }`}>
                      {ev.sync_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {eventos.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p>No hay eventos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEMO_EVENTS: EventRow[] = [
  { id: 'a1', type: 'LOTE_INICIADO',         id_lote: 'demo-1', id_usuario: 'u1', ts: new Date(Date.now()-68*86400000).toISOString(), payload: { especie: 'tilapia_nilotica', count_inicial: 1200, peso_inicial_g: 5 }, sync_status: 'synced' },
  { id: 'a2', type: 'MUESTREO_BIOMETRICO',   id_lote: 'demo-1', id_usuario: 'u1', ts: new Date(Date.now()-38*86400000).toISOString(), payload: { peso_promedio_g: 118.5, cv_pct: 9.2, valid: true, n: 20 }, sync_status: 'synced' },
  { id: 'a3', type: 'ALIMENTO_SUMINISTRADO', id_lote: 'demo-1', id_usuario: 'u1', ts: new Date(Date.now()-1*86400000).toISOString(),  payload: { kg_suministrado: 2.5, lmax_kg: 3.2, n_raciones: 2 }, sync_status: 'pending' },
  { id: 'a4', type: 'AGUA_REGISTRADA',       id_lote: 'demo-1', id_usuario: 'u1', ts: new Date(Date.now()-2*3600000).toISOString(),   payload: { temperatura: 27, oxigeno_disuelto: 7.2, ph: 7.1 }, sync_status: 'pending' },
  { id: 'a5', type: 'LOTE_INICIADO',         id_lote: 'demo-2', id_usuario: 'u2', ts: new Date(Date.now()-42*86400000).toISOString(), payload: { especie: 'tilapia_nilotica', count_inicial: 1000, peso_inicial_g: 8 }, sync_status: 'synced' },
];
