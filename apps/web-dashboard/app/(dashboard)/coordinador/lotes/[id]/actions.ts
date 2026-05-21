'use server';

import { createSupabaseServerClient, isSupabaseConfigured } from '../../../../../lib/supabase/server';

function uuid() {
  return crypto.randomUUID();
}

export interface SaveCorrectionInput {
  eventId: string;
  loteId: string;
  motivo: string;
  payloadCorregido: Record<string, unknown>;
}

export async function saveCorrectionAction(
  input: SaveCorrectionInput,
): Promise<{ error?: string }> {
  if (!input.motivo.trim()) return { error: 'El motivo es obligatorio.' };
  if (!Object.keys(input.payloadCorregido).length) {
    return { error: 'El payload corregido no puede estar vacío.' };
  }

  if (!isSupabaseConfigured()) {
    // Demo mode: simulate success without persisting
    return {};
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('evento_operativo').insert({
    id: uuid(),
    type: 'CORRECCION_REGISTRADA',
    id_lote: input.loteId,
    id_tenant: 'coordinator',
    id_usuario: 'coordinator',
    ts: new Date().toISOString(),
    sync_status: 'synced',
    payload: {
      evento_original_id: input.eventId,
      motivo: input.motivo.trim(),
      payload_corregido: input.payloadCorregido,
    },
  });

  if (error) return { error: error.message };
  return {};
}
