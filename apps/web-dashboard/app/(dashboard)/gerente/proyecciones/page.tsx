import Link from 'next/link';
import { getAllSnapshots } from '@/lib/gerente';
import { projectGrowth } from '@aquashell/shared';

function fmtDate(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function barPct(current: number, target: number) {
  return Math.min(100, Math.round((current / target) * 100));
}

export default async function ProyeccionesPage() {
  const snapshots = await getAllSnapshots();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/gerente" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Gerente
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Proyecciones de Crecimiento</h1>
      </div>

      <div className="space-y-6">
        {snapshots.map(snap => {
          const { state, harvest, estanque, finca } = snap;
          const points = projectGrowth(state.peso_actual_g, state.dias_transcurridos, state.especie);

          // Sample at 0, 30, 60, 90, 120, 150, 180 days
          const milestones = [0, 30, 60, 90, 120, 150, 180]
            .map(d => points.find(p => p.day === d))
            .filter(Boolean) as typeof points;

          const especieLabel = state.especie === 'tilapia_nilotica' ? 'Tilapia Nilótica'
            : state.especie === 'cachama' ? 'Cachama' : 'Trucha';

          const targetPct = barPct(state.peso_actual_g,
            state.especie === 'tilapia_nilotica' ? 350
            : state.especie === 'cachama' ? 600 : 250);

          return (
            <div key={snap.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">{estanque}</h2>
                  <p className="text-xs text-gray-400">{finca} · {especieLabel} · {state.dias_transcurridos} días en ciclo</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">
                    Cosecha est.:
                    <span className="text-primary-700 ml-1">
                      {harvest.days_remaining != null ? `~${harvest.days_remaining} d` : '> 180 d'}
                    </span>
                  </p>
                  {harvest.date && (
                    <p className="text-xs text-gray-400">{fmtDate(harvest.date)}</p>
                  )}
                </div>
              </div>

              {/* Progress toward target weight */}
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progreso al peso objetivo</span>
                  <span className="font-semibold text-gray-800">
                    {state.peso_actual_g} g / {harvest.target_weight_g} g ({targetPct}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all"
                    style={{ width: `${targetPct}%` }}
                  />
                </div>
              </div>

              {/* Milestones table */}
              <div className="px-5 pb-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left pb-2">Día (relativo)</th>
                      <th className="text-left pb-2">Día absoluto</th>
                      <th className="text-left pb-2">Peso proyectado (g)</th>
                      <th className="text-left pb-2">Ganancia diaria (g)</th>
                      <th className="text-left pb-2">Biomasa lote (kg)</th>
                      <th className="text-left pb-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {milestones.map((p) => {
                      const isTarget = p.weight_g >= harvest.target_weight_g;
                      const isCurrent = p.day === 0;
                      const biomasa = (state.count_actual * p.weight_g) / 1000;

                      return (
                        <tr key={p.day} className={isCurrent ? 'bg-primary-50' : ''}>
                          <td className="py-2 pr-4 font-mono font-semibold text-gray-700">
                            {isCurrent ? '→ HOY' : `+${p.day} d`}
                          </td>
                          <td className="py-2 pr-4 text-gray-500">Día {p.abs_day}</td>
                          <td className="py-2 pr-4">
                            <span className={`font-bold ${isTarget ? 'text-green-600' : isCurrent ? 'text-primary-700' : 'text-gray-800'}`}>
                              {p.weight_g.toFixed(0)} g
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-gray-600">
                            {p.daily_gain_g > 0 ? `+${p.daily_gain_g.toFixed(2)} g` : '—'}
                          </td>
                          <td className="py-2 pr-4 text-gray-600">{biomasa.toFixed(1)} kg</td>
                          <td className="py-2">
                            {isTarget ? (
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                ✅ Apto cosecha
                              </span>
                            ) : isCurrent ? (
                              <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                Actual
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">En crecimiento</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {snapshots.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">📈</p>
            <p>Sin lotes activos para proyectar</p>
          </div>
        )}
      </div>
    </div>
  );
}
