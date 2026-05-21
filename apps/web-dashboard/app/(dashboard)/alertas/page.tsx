import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

interface SyncRow {
  id_lote:             string;
  estanque:            string;
  especie:             string;
  eventos_pendientes:  number;
  mas_antiguo:         string;
  mas_reciente:        string;
  tiempo_sin_sync:     string | null;
}

interface RetiroRow {
  id_lote:          string;
  estanque:         string;
  especie:          string;
  nombre_producto:  string;
  principio_activo: string;
  fecha_aplicacion: string;
  fecha_fin_retiro: string;
  dias_restantes:   number;
}

function especieLabel(k: string) {
  return k === 'tilapia_nilotica' ? 'Tilapia Nilótica' : k === 'cachama' ? 'Cachama' : 'Trucha';
}

async function getData() {
  if (!isSupabaseConfigured()) {
    return { sync: DEMO_SYNC, retiro: DEMO_RETIRO };
  }
  const supabase = createSupabaseServerClient();

  const { data: sync }   = await supabase.from('v_sync_pendiente').select('*').order('mas_antiguo', { ascending: true });
  const { data: retiro } = await supabase.from('v_retiro_vigente').select('*').order('dias_restantes', { ascending: true });

  return {
    sync:   (sync   ?? []) as SyncRow[],
    retiro: (retiro ?? []) as RetiroRow[],
  };
}

export default async function AlertasPage() {
  const { sync, retiro } = await getData();
  const demo = !isSupabaseConfigured();

  const totalPending = sync.reduce((s, r) => s + r.eventos_pendientes, 0);
  const criticalRetiro = retiro.filter(r => r.dias_restantes <= 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas de Monitoreo</h1>
          <p className="text-gray-500 text-sm mt-0.5">Sincronización pendiente · Períodos de retiro activos</p>
        </div>
        <div className="flex gap-2 items-center">
          {demo && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              MODO DEMO
            </span>
          )}
          {(totalPending > 0 || criticalRetiro.length > 0) && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
              {totalPending > 0 && `${totalPending} evento${totalPending > 1 ? 's' : ''} sin sync`}
              {totalPending > 0 && criticalRetiro.length > 0 && ' · '}
              {criticalRetiro.length > 0 && `${criticalRetiro.length} retiro${criticalRetiro.length > 1 ? 's' : ''} crítico${criticalRetiro.length > 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      </div>

      {/* Sync queue */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          ↑ Cola de Sincronización
          {sync.length > 0
            ? <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{sync.length} lote{sync.length > 1 ? 's' : ''}</span>
            : <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Todo sincronizado</span>
          }
        </h2>

        {sync.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm">No hay eventos pendientes de sincronización.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Estanque', 'Especie', 'Pendientes', 'Más antiguo', 'Último', 'Tiempo sin sync'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sync.map(row => {
                  const ageMs = Date.now() - new Date(row.mas_antiguo).getTime();
                  const ageDays = Math.floor(ageMs / 86400000);
                  const severe = ageDays >= 2;
                  return (
                    <tr key={row.id_lote} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">{row.estanque}</td>
                      <td className="px-4 py-3 text-gray-600">{especieLabel(row.especie)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${severe ? 'text-red-600' : 'text-amber-600'}`}>
                          {row.eventos_pendientes}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(row.mas_antiguo).toLocaleDateString('es-CO')}{' '}
                        {new Date(row.mas_antiguo).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(row.mas_reciente).toLocaleDateString('es-CO')}{' '}
                        {new Date(row.mas_reciente).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          severe ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ageDays > 0 ? `${ageDays} d` : '< 1 d'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Withdrawal alerts */}
      <section>
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          ⛔ Períodos de Retiro Activos
          {retiro.length > 0
            ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{retiro.length} lote{retiro.length > 1 ? 's' : ''}</span>
            : <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Sin retiros activos</span>
          }
        </h2>

        {retiro.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm">Ningún lote tiene período de retiro activo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {retiro.map(row => {
              const critical = row.dias_restantes <= 3;
              return (
                <div
                  key={row.id_lote}
                  className={`rounded-xl border p-5 ${critical ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{row.estanque}</p>
                      <p className="text-xs text-gray-500">{especieLabel(row.especie)}</p>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      critical ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {row.dias_restantes} día{row.dias_restantes !== 1 ? 's' : ''} restante{row.dias_restantes !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">💊 {row.nombre_producto}</p>
                  <p className="text-xs text-gray-500 mb-3">Principio activo: {row.principio_activo}</p>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Aplicado: {new Date(row.fecha_aplicacion).toLocaleDateString('es-CO')}</span>
                    <span>Fin retiro: <strong>{new Date(row.fecha_fin_retiro).toLocaleDateString('es-CO')}</strong></span>
                  </div>
                  {critical && (
                    <p className="mt-2 text-xs font-bold text-red-700">
                      ⚠️ Retiro próximo a vencer — verificar antes de cosechar
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_SYNC: SyncRow[] = [
  {
    id_lote: 'demo-1', estanque: 'Estanque 1-A', especie: 'tilapia_nilotica',
    eventos_pendientes: 4,
    mas_antiguo:  new Date(Date.now() - 2 * 86400000).toISOString(),
    mas_reciente: new Date(Date.now() - 30 * 60000).toISOString(),
    tiempo_sin_sync: '2 days',
  },
];

const DEMO_RETIRO: RetiroRow[] = [
  {
    id_lote: 'demo-3', estanque: 'Estanque 1-C', especie: 'trucha',
    nombre_producto: 'Florfenicol 50%', principio_activo: 'Florfenicol',
    fecha_aplicacion: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
    fecha_fin_retiro: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    dias_restantes: 2,
  },
  {
    id_lote: 'demo-2', estanque: 'Estanque 1-B', especie: 'tilapia_nilotica',
    nombre_producto: 'Oxitetraciclina 20%', principio_activo: 'Oxitetraciclina',
    fecha_aplicacion: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    fecha_fin_retiro: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    dias_restantes: 25,
  },
];
