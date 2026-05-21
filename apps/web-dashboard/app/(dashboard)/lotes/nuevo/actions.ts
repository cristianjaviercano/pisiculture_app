'use server';

import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import type { SpeciesKey } from '@aquashell/shared';

function uuid() {
  return crypto.randomUUID();
}

export interface NuevoLoteInput {
  id_estanque: string;
  id_finca: string;
  especie: SpeciesKey;
  nombre: string;
  count_inicial: number;
  peso_inicial_g: number;
  unidad_costo_cop: number;
}

export async function crearLoteAction(
  input: NuevoLoteInput,
): Promise<{ loteId?: string; error?: string }> {
  const supabase = createSupabaseServerClient();

  const loteId = uuid();
  const now = new Date().toISOString();

  // Create lote record
  const { error: loteErr } = await supabase.from('lotes').insert({
    id: loteId,
    id_estanque: input.id_estanque,
    id_finca: input.id_finca,
    especie: input.especie,
    nombre: input.nombre,
    estado: 'activo',
    fecha_inicio: now.slice(0, 10),
    count_actual: input.count_inicial,
    peso_actual_g: input.peso_inicial_g,
    total_alimento_kg: 0,
  });

  if (loteErr) return { error: loteErr.message };

  // Seed LOTE_INICIADO event
  const { error: evErr } = await supabase.from('evento_operativo').insert({
    id: uuid(),
    type: 'LOTE_INICIADO',
    id_lote: loteId,
    id_tenant: 'web',
    id_usuario: 'web-coordinator',
    ts: now,
    sync_status: 'synced',
    payload: {
      especie: input.especie,
      count_inicial: input.count_inicial,
      peso_inicial_g: input.peso_inicial_g,
      id_estanque: input.id_estanque,
      id_finca: input.id_finca,
      unidad_costo_cop: input.unidad_costo_cop,
    },
  });

  if (evErr) {
    // Roll back lote if event failed
    await supabase.from('lotes').delete().eq('id', loteId);
    return { error: evErr.message };
  }

  return { loteId };
}
