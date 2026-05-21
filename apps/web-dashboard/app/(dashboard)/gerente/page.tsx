import Link from 'next/link';
import { getAllSnapshots } from '@/lib/gerente';
import { isSupabaseConfigured } from '@/lib/supabase/server';

function cop(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP',
    maximumFractionDigits: 0 }).format(n);
}
function pct(n: number | null) {
  if (n === null) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export default async function GerentePage() {
  const snapshots = await getAllSnapshots();
  const demo = !isSupabaseConfigured();

  // ── Aggregated KPIs ──────────────────────────────────────────────────────
  const totalBiomasa    = snapshots.reduce((s, x) => s + x.state.biomasa_kg, 0);
  const totalPeces      = snapshots.reduce((s, x) => s + x.state.count_actual, 0);
  const totalAlimento   = snapshots.reduce((s, x) => s + x.state.total_alimento_kg, 0);
  const totalPending    = snapshots.reduce((s, x) => s + x.pendingCount, 0);
  const totalInversion  = snapshots.reduce((s, x) => s + x.roi.total_cost, 0);
  const totalIngreso    = snapshots.reduce((s, x) => s + x.roi.gross_income, 0);
  const totalMargen     = totalIngreso - totalInversion;

  const fcaVals = snapshots.map(x => x.state.fca_acumulado).filter((v): v is number => v !== null);
  const fcaProm = fcaVals.length ? (fcaVals.reduce((a, b) => a + b, 0) / fcaVals.length) : null;

  const nextHarvest = snapshots
    .filter(x => x.harvest.days_remaining !== null)
    .sort((a, b) => (a.harvest.days_remaining ?? 9999) - (b.harvest.days_remaining ?? 9999))[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Gerencial</h1>
          <p className="text-gray-500 text-sm mt-0.5">KPIs consolidados · Vista Gerente</p>
        </div>
        <div className="flex gap-2">
          {demo && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              MODO DEMO
            </span>
          )}
          {totalPending > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
              {totalPending} evento{totalPending > 1 ? 's' : ''} sin sincronizar
            </span>
          )}
        </div>
      </div>

      {/* KPI Hero Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KPICard label="Biomasa total" value={`${totalBiomasa.toFixed(1)} kg`} icon="🐟" color="primary" />
        <KPICard label="Total peces"   value={totalPeces.toLocaleString('es-CO')} icon="🐠" color="primary" />
        <KPICard label="Alimento"      value={`${totalAlimento.toFixed(0)} kg`}   icon="🌾" color="gray" />
        <KPICard label="FCA promedio"  value={fcaProm ? fcaProm.toFixed(2) : '—'} icon="📊" color={fcaProm && fcaProm < 2 ? 'green' : 'amber'} />
        <KPICard label="Lotes activos" value={String(snapshots.length)}            icon="🏊" color="gray" />
        <KPICard label="Próx. cosecha" icon="📅" color="blue"
          value={nextHarvest ? `~${nextHarvest.harvest.days_remaining} d` : '—'}
          sub={nextHarvest ? nextHarvest.estanque : undefined} />
      </div>

      {/* Finanzas proyectadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <FinCard label="Inversión total proyectada" value={cop(totalInversion)} icon="💰" neutral />
        <FinCard label="Ingresos proyectados" value={cop(totalIngreso)} icon="📈" positive={totalIngreso > totalInversion} />
        <FinCard label="Margen bruto proyectado" value={cop(totalMargen)}
          sub={totalInversion > 0 ? `ROI ${pct((totalMargen / totalInversion) * 100)}` : undefined}
          positive={totalMargen > 0} icon="🏦" />
      </div>

      {/* Tabla por lote */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Análisis por Lote</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Estanque','Finca','Días','Peces','Biomasa','LMax/día','FCA','Cosecha est.','ROI proy.'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {snapshots.map(snap => (
                <tr key={snap.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/lotes/${snap.id}`} className="font-semibold text-primary-700 hover:underline">
                      {snap.estanque}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{snap.finca}</td>
                  <td className="px-4 py-3 text-gray-800">{snap.state.dias_transcurridos} d</td>
                  <td className="px-4 py-3 text-gray-800">{snap.state.count_actual.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{snap.state.biomasa_kg.toFixed(1)} kg</td>
                  <td className="px-4 py-3 font-semibold text-primary-700">{snap.lmax} kg</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      snap.state.fca_acumulado === null ? 'text-gray-400'
                      : snap.state.fca_acumulado < 1.8 ? 'text-green-600'
                      : snap.state.fca_acumulado < 2.5 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {snap.state.fca_acumulado?.toFixed(2) ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {snap.harvest.days_remaining != null
                      ? `~${snap.harvest.days_remaining} d · ${snap.harvest.projected_weight_g?.toFixed(0)} g`
                      : '> 180 d'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-bold ${snap.roi.profitable ? 'text-green-600' : 'text-red-600'}`}>
                      {pct(snap.roi.roi_pct)}
                    </span>
                    <span className="text-gray-400 text-xs ml-1">
                      ({cop(snap.roi.gross_margin)})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {snapshots.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📊</p>
              <p>Sin lotes activos para analizar</p>
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/dashboard/gerente/proyecciones"
          className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          📈 Ver proyecciones de crecimiento
        </Link>
        <Link href="/dashboard/gerente/roi"
          className="bg-white border border-gray-200 hover:border-primary-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          💰 Análisis ROI detallado
        </Link>
        <Link href="/dashboard/eventos"
          className="bg-white border border-gray-200 hover:border-primary-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          📋 Stream de eventos
        </Link>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color, sub }: {
  label: string; value: string; icon: string;
  color: 'primary' | 'gray' | 'green' | 'amber' | 'blue';
  sub?: string;
}) {
  const valColor = {
    primary: 'text-primary-700', gray: 'text-gray-800',
    green: 'text-green-600', amber: 'text-amber-600', blue: 'text-blue-600',
  }[color];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xl mb-1">{icon}</p>
      <p className={`text-xl font-bold ${valColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function FinCard({ label, value, icon, sub, positive, neutral }: {
  label: string; value: string; icon: string; sub?: string;
  positive?: boolean; neutral?: boolean;
}) {
  const col = neutral ? 'text-gray-800' : positive ? 'text-green-600' : 'text-red-600';
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-2xl mb-1">{icon}</p>
      <p className={`text-2xl font-bold ${col}`}>{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
