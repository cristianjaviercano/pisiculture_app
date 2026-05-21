import Link from 'next/link';
import { getAllSnapshots } from '@/lib/gerente';

function cop(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP',
    maximumFractionDigits: 0 }).format(n);
}

function pct(n: number | null) {
  if (n === null) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export default async function ROIPage() {
  const snapshots = await getAllSnapshots();

  const totalCost   = snapshots.reduce((s, x) => s + x.roi.total_cost, 0);
  const totalIncome = snapshots.reduce((s, x) => s + x.roi.gross_income, 0);
  const totalMargin = totalIncome - totalCost;
  const totalROI    = totalCost > 0 ? (totalMargin / totalCost) * 100 : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/gerente" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Gerente
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Análisis ROI por Lote</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Proyección basada en peso objetivo de la especie, precio de venta de referencia y costos actuales.
        Los valores son estimados a fecha de cosecha proyectada.
      </p>

      {/* Resumen total */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Inversión total</p>
          <p className="text-2xl font-bold text-gray-800">{cop(totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ingresos proyectados</p>
          <p className="text-2xl font-bold text-gray-800">{cop(totalIncome)}</p>
        </div>
        <div className={`rounded-xl border p-5 ${totalMargin >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Margen bruto</p>
          <p className={`text-2xl font-bold ${totalMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {cop(totalMargin)}
          </p>
        </div>
        <div className={`rounded-xl border p-5 ${(totalROI ?? 0) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ROI consolidado</p>
          <p className={`text-3xl font-black ${(totalROI ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {pct(totalROI)}
          </p>
        </div>
      </div>

      {/* Detalle por lote */}
      <div className="space-y-4">
        {snapshots.map(snap => {
          const { roi, state, estanque, finca, harvest } = snap;
          const especieLabel = state.especie === 'tilapia_nilotica' ? 'Tilapia Nilótica'
            : state.especie === 'cachama' ? 'Cachama' : 'Trucha';

          return (
            <div key={snap.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">{estanque}</h2>
                  <p className="text-xs text-gray-400">{finca} · {especieLabel}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${roi.profitable ? 'text-green-600' : 'text-red-600'}`}>
                    {pct(roi.roi_pct)}
                  </p>
                  <p className="text-xs text-gray-400">ROI proyectado</p>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Inversión semilla</p>
                    <p className="font-semibold text-gray-800">{cop(roi.seed_cost)}</p>
                    <p className="text-gray-400 text-xs">{state.count_inicial.toLocaleString()} peces × {cop(snap.seedCostCop)}/u</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Costo alimento</p>
                    <p className="font-semibold text-gray-800">{cop(roi.feed_cost)}</p>
                    <p className="text-gray-400 text-xs">{state.total_alimento_kg.toFixed(1)} kg × {cop(2_800)}/kg</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Costo total</p>
                    <p className="font-bold text-gray-900">{cop(roi.total_cost)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Ingreso proyectado</p>
                    <p className="font-bold text-gray-900">{cop(roi.gross_income)}</p>
                    <p className="text-gray-400 text-xs">
                      {state.count_actual.toLocaleString()} peces ×{' '}
                      {harvest.projected_weight_g?.toFixed(0) ?? '—'} g ×{' '}
                      precio ref.
                    </p>
                  </div>
                </div>

                {/* Break-even bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Costos: {cop(roi.total_cost)}</span>
                    <span>Ingresos: {cop(roi.gross_income)}</span>
                  </div>
                  <div className="h-4 bg-red-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-4 rounded-full ${roi.profitable ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, (roi.gross_income / Math.max(roi.total_cost, roi.gross_income)) * 100)}%` }}
                    />
                    <div
                      className="absolute top-0 h-4 w-0.5 bg-gray-400"
                      style={{ left: `${(roi.total_cost / Math.max(roi.total_cost, roi.gross_income)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className={roi.profitable ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Margen: {cop(roi.gross_margin)}
                    </span>
                    <span className={`font-bold ${roi.profitable ? 'text-green-600' : 'text-red-600'}`}>
                      {roi.profitable ? '✅ Rentable' : '⚠️ No rentable con supuestos actuales'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notas metodológicas */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 px-5 py-4 text-xs text-gray-500">
        <p className="font-semibold text-gray-600 mb-1">Notas metodológicas</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Precio venta ref.: Tilapia 8.000 COP/kg · Cachama 9.500 COP/kg · Trucha 15.000 COP/kg</li>
          <li>Costo alimento: 2.800 COP/kg (actualizable en configuración del tenant)</li>
          <li>Ingresos proyectados sobre biomasa a peso objetivo (Von Bertalanffy) con peces actuales vivos</li>
          <li>No incluye costos de mano de obra, energía ni depreciación de infraestructura</li>
        </ul>
      </div>
    </div>
  );
}
