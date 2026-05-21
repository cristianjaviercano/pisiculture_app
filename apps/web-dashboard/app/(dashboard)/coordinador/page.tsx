import Link from 'next/link';
import { getAllSnapshots } from '../../../lib/gerente';

export const dynamic = 'force-dynamic';

function SyncBadge({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Sincronizado</span>;
  }
  return (
    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
      {count} pendiente{count > 1 ? 's' : ''}
    </span>
  );
}

export default async function CoordinadorPage() {
  const snapshots = await getAllSnapshots();
  const pendingLotes = snapshots.filter(s => s.pendingCount > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel del Coordinador</h1>
        <p className="text-slate-500 mt-1">
          Revisión y corrección de eventos registrados en campo.
        </p>
      </div>

      {pendingLotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 font-semibold text-sm">
            ⚠️ {pendingLotes.length} lote{pendingLotes.length > 1 ? 's' : ''} con eventos pendientes de sincronización
          </p>
        </div>
      )}

      {snapshots.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-2">📭</p>
          <p>Sin lotes activos</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {snapshots.map(snap => (
            <Link
              key={snap.id}
              href={`/dashboard/coordinador/lotes/${snap.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800 truncate">{snap.estanque}</span>
                    <span className="text-slate-400 text-sm">·</span>
                    <span className="text-slate-500 text-sm truncate">{snap.finca}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-500">
                    <span>{snap.state.count_actual.toLocaleString()} peces</span>
                    <span>{snap.state.biomasa_kg.toFixed(1)} kg biomasa</span>
                    <span>{snap.state.dias_transcurridos} días en ciclo</span>
                    {snap.state.cosechado && (
                      <span className="text-green-600 font-medium">🎣 Cosechado</span>
                    )}
                    {snap.state.retiro_activo && (
                      <span className="text-red-600 font-medium">⛔ En retiro</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <SyncBadge count={snap.pendingCount} />
                  <span className="text-xs text-primary-600 font-medium">Ver eventos →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
