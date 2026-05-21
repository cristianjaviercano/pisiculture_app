import Link from 'next/link';
import { createSupabaseServerClient, isSupabaseConfigured } from '../../../../lib/supabase/server';
import { NuevoLoteForm } from './NuevoLoteForm';

interface EstanqueRow {
  id: string;
  nombre: string;
  id_finca: string;
  fincas: { nombre: string } | null;
}

async function getEstanques(): Promise<EstanqueRow[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('estanques')
    .select('id, nombre, id_finca, fincas(nombre)')
    .order('nombre');
  return (data ?? []) as EstanqueRow[];
}

export default async function NuevoLotePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <p className="text-5xl">⚙️</p>
        <p className="font-semibold text-slate-700">Supabase requerido</p>
        <p className="text-sm text-slate-500">
          Configura las variables <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
          y <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para crear
          lotes desde el dashboard web.
        </p>
        <Link href="/dashboard" className="inline-block text-primary-600 text-sm hover:underline">
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  const estanques = await getEstanques();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-primary-600 hover:text-primary-800">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Nuevo Ciclo de Producción</h1>
      </div>

      {estanques.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">Sin estanques registrados</p>
          <p>
            Registra al menos un estanque en Supabase antes de iniciar un ciclo de producción.
            Puedes hacerlo desde el panel de administración de la base de datos.
          </p>
        </div>
      ) : (
        <NuevoLoteForm estanques={estanques} />
      )}
    </div>
  );
}
